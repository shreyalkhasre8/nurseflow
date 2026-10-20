import { Response } from 'express';
import crypto from 'crypto';
import { db } from '../config/db.js';
import { AuthenticatedRequest } from '../middlewares/auth.js';
import { logAudit } from '../services/auditService.js';
import { createNotification, notifyRole } from '../services/notificationService.js';

export function getCategories(req: AuthenticatedRequest, res: Response) {
  try {
    const categories = db.prepare(`SELECT * FROM task_categories ORDER BY name`).all();
    return res.json(categories);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch categories' });
  }
}

export function getMyTasks(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const { status, priority, category, search } = req.query;

    let query = `
      SELECT t.*, tc.name as category_name, tc.color as category_color, tc.icon as category_icon,
             w.name as ward_name, u_assigned.name as assigned_to_name, u_creator.name as created_by_name
      FROM tasks t
      JOIN task_categories tc ON t.category_id = tc.id
      JOIN wards w ON t.ward_id = w.id
      JOIN users u_assigned ON t.assigned_to = u_assigned.id
      JOIN users u_creator ON t.created_by = u_creator.id
      WHERE t.assigned_to = ?
    `;
    const params: any[] = [req.user.id];

    if (status && status !== 'ALL') {
      query += ` AND t.status = ?`;
      params.push(status);
    }
    if (priority && priority !== 'ALL') {
      query += ` AND t.priority = ?`;
      params.push(priority);
    }
    if (category && category !== 'ALL') {
      query += ` AND t.category_id = ?`;
      params.push(category);
    }
    if (search) {
      query += ` AND (t.title LIKE ? OR t.description LIKE ? OR t.patient_reference LIKE ?)`;
      const s = `%${search}%`;
      params.push(s, s, s);
    }

    query += ` ORDER BY CASE t.priority WHEN 'Urgent' THEN 1 WHEN 'High' THEN 2 WHEN 'Medium' THEN 3 ELSE 4 END, t.due_date ASC`;

    const tasks = db.prepare(query).all(...params);
    return res.json(tasks);
  } catch (err) {
    console.error('getMyTasks error:', err);
    return res.status(500).json({ error: 'Failed to fetch tasks' });
  }
}

export function getAllTasks(req: AuthenticatedRequest, res: Response) {
  try {
    const { status, priority, category, wardId, nurseId, search, overdueOnly } = req.query;

    let query = `
      SELECT t.*, tc.name as category_name, tc.color as category_color, tc.icon as category_icon,
             w.name as ward_name, u_assigned.name as assigned_to_name, u_creator.name as created_by_name
      FROM tasks t
      JOIN task_categories tc ON t.category_id = tc.id
      JOIN wards w ON t.ward_id = w.id
      JOIN users u_assigned ON t.assigned_to = u_assigned.id
      JOIN users u_creator ON t.created_by = u_creator.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (status && status !== 'ALL') {
      query += ` AND t.status = ?`;
      params.push(status);
    }
    if (priority && priority !== 'ALL') {
      query += ` AND t.priority = ?`;
      params.push(priority);
    }
    if (category && category !== 'ALL') {
      query += ` AND t.category_id = ?`;
      params.push(category);
    }
    if (wardId && wardId !== 'ALL') {
      query += ` AND t.ward_id = ?`;
      params.push(wardId);
    }
    if (nurseId && nurseId !== 'ALL') {
      query += ` AND t.assigned_to = ?`;
      params.push(nurseId);
    }
    if (search) {
      query += ` AND (t.title LIKE ? OR t.description LIKE ? OR t.patient_reference LIKE ?)`;
      const s = `%${search}%`;
      params.push(s, s, s);
    }
    if (overdueOnly === 'true') {
      query += ` AND t.status != 'Completed' AND t.status != 'Cancelled' AND datetime(t.due_date) < datetime('now')`;
    }

    query += ` ORDER BY CASE t.priority WHEN 'Urgent' THEN 1 WHEN 'High' THEN 2 WHEN 'Medium' THEN 3 ELSE 4 END, t.due_date ASC`;

    const tasks = db.prepare(query).all(...params);
    return res.json(tasks);
  } catch (err) {
    console.error('getAllTasks error:', err);
    return res.status(500).json({ error: 'Failed to fetch tasks' });
  }
}

export function getTaskById(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const task = db.prepare(`
      SELECT t.*, tc.name as category_name, tc.color as category_color, tc.icon as category_icon,
             w.name as ward_name, u_assigned.name as assigned_to_name, u_assigned.employee_id as assigned_to_emp_id,
             u_creator.name as created_by_name, u_completer.name as completed_by_name
      FROM tasks t
      JOIN task_categories tc ON t.category_id = tc.id
      JOIN wards w ON t.ward_id = w.id
      JOIN users u_assigned ON t.assigned_to = u_assigned.id
      JOIN users u_creator ON t.created_by = u_creator.id
      LEFT JOIN users u_completer ON t.completed_by = u_completer.id
      WHERE t.id = ?
    `).get(id) as any;

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Get comments
    const comments = db.prepare(`
      SELECT tc.*, u.name as user_name, u.employee_id, r.name as role_name
      FROM task_comments tc
      JOIN users u ON tc.user_id = u.id
      JOIN roles r ON u.role_id = r.id
      WHERE tc.task_id = ?
      ORDER BY tc.created_at ASC
    `).all(id);

    // Get activity timeline
    const history = db.prepare(`
      SELECT th.*, u.name as user_name, u.employee_id
      FROM task_history th
      JOIN users u ON th.user_id = u.id
      WHERE th.task_id = ?
      ORDER BY th.created_at DESC
    `).all(id);

    return res.json({
      ...task,
      comments,
      history
    });
  } catch (err) {
    console.error('getTaskById error:', err);
    return res.status(500).json({ error: 'Failed to retrieve task details' });
  }
}

export function createTask(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const {
      title,
      description,
      categoryId,
      wardId,
      assignedTo,
      priority = 'Medium',
      dueDate,
      recurrence = 'NONE',
      patientReference,
      instructions
    } = req.body;

    if (!title || !categoryId || !wardId || !assignedTo || !dueDate) {
      return res.status(400).json({ error: 'Title, category, ward, assigned nurse, and due date are required.' });
    }

    const taskId = crypto.randomUUID();

    const insertStmt = db.prepare(`
      INSERT INTO tasks (
        id, title, description, category_id, ward_id, assigned_to, created_by,
        priority, status, due_date, recurrence, patient_reference, instructions,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Pending', ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `);

    insertStmt.run(
      taskId,
      title.trim(),
      description || null,
      categoryId,
      wardId,
      assignedTo,
      req.user.id,
      priority,
      dueDate,
      recurrence,
      patientReference || null,
      instructions || null
    );

    // Record initial history
    const historyId = crypto.randomUUID();
    db.prepare(`
      INSERT INTO task_history (id, task_id, user_id, action, details)
      VALUES (?, ?, ?, 'TASK_CREATED', ?)
    `).run(historyId, taskId, req.user.id, `Created task "${title}" with priority ${priority}`);

    // Notify assigned nurse
    createNotification({
      userId: assignedTo,
      title: 'New Clinical Task Assigned',
      message: `You have been assigned task: "${title}". Due: ${new Date(dueDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
      type: 'TASK',
      priority: priority === 'Urgent' ? 'Urgent' : priority === 'High' ? 'High' : 'Normal',
      link: `/tasks/${taskId}`
    });

    logAudit({
      userId: req.user.id,
      action: 'TASK_CREATE',
      entity: 'TASK',
      recordId: taskId,
      details: { title, priority, assignedTo, wardId },
      ipAddress: req.ip || '127.0.0.1'
    });

    return res.status(201).json({ id: taskId, message: 'Task created successfully' });
  } catch (err: any) {
    console.error('createTask error:', err);
    return res.status(500).json({ error: 'Failed to create task' });
  }
}

export function updateTask(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const { id } = req.params;
    const { title, description, priority, dueDate, instructions, patientReference } = req.body;

    const existing = db.prepare(`SELECT * FROM tasks WHERE id = ?`).get(id) as any;
    if (!existing) return res.status(404).json({ error: 'Task not found' });

    db.prepare(`
      UPDATE tasks SET
        title = COALESCE(?, title),
        description = COALESCE(?, description),
        priority = COALESCE(?, priority),
        due_date = COALESCE(?, due_date),
        instructions = COALESCE(?, instructions),
        patient_reference = COALESCE(?, patient_reference),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(title, description, priority, dueDate, instructions, patientReference, id);

    db.prepare(`
      INSERT INTO task_history (id, task_id, user_id, action, details)
      VALUES (?, ?, ?, 'TASK_UPDATED', ?)
    `).run(crypto.randomUUID(), id, req.user.id, 'Task specifications modified');

    return res.json({ message: 'Task updated successfully' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update task' });
  }
}

export function updateTaskStatus(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const { id } = req.params;
    const { status, completionNotes } = req.body;

    if (!['Pending', 'In Progress', 'Completed', 'Cancelled'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const task = db.prepare(`SELECT * FROM tasks WHERE id = ?`).get(id) as any;
    if (!task) return res.status(404).json({ error: 'Task not found' });

    const isCompleted = status === 'Completed';

    db.prepare(`
      UPDATE tasks SET
        status = ?,
        completion_notes = COALESCE(?, completion_notes),
        completed_at = CASE WHEN ? THEN CURRENT_TIMESTAMP ELSE completed_at END,
        completed_by = CASE WHEN ? THEN ? ELSE completed_by END,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(status, completionNotes || null, isCompleted ? 1 : 0, isCompleted ? 1 : 0, req.user.id, id);

    // Record history
    db.prepare(`
      INSERT INTO task_history (id, task_id, user_id, action, details)
      VALUES (?, ?, ?, 'STATUS_CHANGED', ?)
    `).run(
      crypto.randomUUID(),
      id,
      req.user.id,
      `Status changed from ${task.status} to ${status}${completionNotes ? ` with note: "${completionNotes}"` : ''}`
    );

    logAudit({
      userId: req.user.id,
      action: isCompleted ? 'TASK_COMPLETION' : 'TASK_STATUS_UPDATE',
      entity: 'TASK',
      recordId: id,
      details: { previousStatus: task.status, newStatus: status, completionNotes },
      ipAddress: req.ip || '127.0.0.1'
    });

    return res.json({ message: `Task status updated to ${status}` });
  } catch (err) {
    console.error('updateTaskStatus error:', err);
    return res.status(500).json({ error: 'Failed to update task status' });
  }
}

export function reassignTask(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const { id } = req.params;
    const { newAssignedTo, reason } = req.body;

    if (!newAssignedTo) return res.status(400).json({ error: 'Target nurse required' });

    const task = db.prepare(`SELECT * FROM tasks WHERE id = ?`).get(id) as any;
    if (!task) return res.status(404).json({ error: 'Task not found' });

    const newNurse = db.prepare(`SELECT id, name FROM users WHERE id = ?`).get(newAssignedTo) as any;
    if (!newNurse) return res.status(404).json({ error: 'Assigned nurse not found' });

    db.prepare(`
      UPDATE tasks SET assigned_to = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `).run(newAssignedTo, id);

    db.prepare(`
      INSERT INTO task_history (id, task_id, user_id, action, details)
      VALUES (?, ?, ?, 'TASK_REASSIGNED', ?)
    `).run(
      crypto.randomUUID(),
      id,
      req.user.id,
      `Reassigned to ${newNurse.name}${reason ? ` (Reason: ${reason})` : ''}`
    );

    createNotification({
      userId: newAssignedTo,
      title: 'Task Reassigned To You',
      message: `You have been reassigned task: "${task.title}". Priority: ${task.priority}`,
      type: 'TASK',
      priority: task.priority === 'Urgent' ? 'Urgent' : 'High',
      link: `/tasks/${id}`
    });

    logAudit({
      userId: req.user.id,
      action: 'TASK_REASSIGNMENT',
      entity: 'TASK',
      recordId: id,
      details: { previousNurse: task.assigned_to, newNurse: newAssignedTo, reason },
      ipAddress: req.ip || '127.0.0.1'
    });

    return res.json({ message: `Task successfully reassigned to ${newNurse.name}` });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to reassign task' });
  }
}

export function escalateTask(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const { id } = req.params;
    const { reason } = req.body;

    const task = db.prepare(`SELECT * FROM tasks WHERE id = ?`).get(id) as any;
    if (!task) return res.status(404).json({ error: 'Task not found' });

    db.prepare(`
      UPDATE tasks SET escalated = 1, escalated_reason = ?, priority = 'Urgent', updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `).run(reason || 'Escalated by clinical staff', id);

    db.prepare(`
      INSERT INTO task_history (id, task_id, user_id, action, details)
      VALUES (?, ?, ?, 'TASK_ESCALATED', ?)
    `).run(
      crypto.randomUUID(),
      id,
      req.user.id,
      `Task escalated to Urgent. Reason: ${reason || 'Clinical attention requested'}`
    );

    notifyRole('Head Nurse / Supervisor', {
      title: 'Urgent Task Escalation',
      message: `Task "${task.title}" has been escalated: ${reason || 'Immediate supervisor review requested.'}`,
      type: 'ESCALATION',
      priority: 'Urgent',
      link: `/tasks/${id}`
    });

    logAudit({
      userId: req.user.id,
      action: 'TASK_ESCALATION',
      entity: 'TASK',
      recordId: id,
      details: { reason },
      ipAddress: req.ip || '127.0.0.1'
    });

    return res.json({ message: 'Task escalated to Supervisor successfully' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to escalate task' });
  }
}

export function addTaskComment(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const { id } = req.params;
    const { comment } = req.body;

    if (!comment || !comment.trim()) {
      return res.status(400).json({ error: 'Comment text is required' });
    }

    const commentId = crypto.randomUUID();
    db.prepare(`
      INSERT INTO task_comments (id, task_id, user_id, comment, created_at)
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
    `).run(commentId, id, req.user.id, comment.trim());

    db.prepare(`
      INSERT INTO task_history (id, task_id, user_id, action, details)
      VALUES (?, ?, ?, 'COMMENT_ADDED', ?)
    `).run(crypto.randomUUID(), id, req.user.id, `Added clinical note: "${comment.trim().slice(0, 60)}..."`);

    return res.status(201).json({ id: commentId, message: 'Comment added' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to add comment' });
  }
}
