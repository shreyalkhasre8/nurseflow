import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { api } from '../../services/api';
import { Task, TaskCategory, Ward, User } from '../../types';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { Drawer } from '../../components/common/Drawer';
import { PageHeader } from '../../components/common/PageHeader';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import {
  CheckSquare,
  Plus,
  Search,
  Filter,
  Clock,
  AlertTriangle,
  User as UserIcon,
  Building2,
  Calendar,
  Send,
  ArrowRightLeft,
  Flame,
  CheckCircle2,
  MessageSquare,
  History,
  AlertCircle,
} from 'lucide-react';

export const TasksPage: React.FC = () => {
  const { user, isNurse, isSupervisor, isAdmin } = useAuth();
  const { success, error, warning } = useToast();

  const [activeTab, setActiveTab] = useState<'my' | 'all'>('my');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [categories, setCategories] = useState<TaskCategory[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [staffList, setStaffList] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [wardFilter, setWardFilter] = useState('ALL');
  const [overdueOnly, setOverdueOnly] = useState(false);

  // Modals & Drawers
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);
  const [isReassignModalOpen, setIsReassignModalOpen] = useState(false);
  const [isEscalateModalOpen, setIsEscalateModalOpen] = useState(false);

  // Form states
  const [completionNotes, setCompletionNotes] = useState('');
  const [newAssigneeId, setNewAssigneeId] = useState('');
  const [reassignReason, setReassignReason] = useState('');
  const [escalateReason, setEscalateReason] = useState('');
  const [newComment, setNewComment] = useState('');

  // New task form state
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    categoryId: '',
    wardId: user?.wardId || '',
    assignedTo: user?.id || '',
    priority: 'Medium',
    dueDate: new Date(Date.now() + 2 * 3600 * 1000).toISOString().slice(0, 16),
    recurrence: 'NONE',
    patientReference: '',
    instructions: '',
  });

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [cats, wardsData, usersData] = await Promise.all([
        api.getCategories(),
        api.getWards(),
        api.getUsers({ roleId: 'role-nurse' }),
      ]);
      setCategories(cats);
      setWards(wardsData);
      setStaffList(usersData);

      if (activeTab === 'my') {
        const myTasks = await api.getMyTasks({
          status: statusFilter,
          priority: priorityFilter,
          category: categoryFilter,
          search,
        });
        setTasks(myTasks);
      } else {
        const allTasks = await api.getAllTasks({
          status: statusFilter,
          priority: priorityFilter,
          category: categoryFilter,
          wardId: wardFilter,
          search,
          overdueOnly: overdueOnly ? 'true' : 'false',
        });
        setTasks(allTasks);
      }
    } catch (err: any) {
      error(err.message || 'Failed to fetch tasks');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeTab, statusFilter, priorityFilter, categoryFilter, wardFilter, overdueOnly, search]);

  const openTaskDetails = async (task: Task) => {
    try {
      const details = await api.getTaskById(task.id);
      setSelectedTask(details);
      setIsDetailsOpen(true);
    } catch (err) {
      error('Failed to load task details');
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createTask({
        ...newTask,
        dueDate: new Date(newTask.dueDate).toISOString(),
      } as any);
      success('Clinical task created and assigned successfully.');
      setIsCreateOpen(false);
      setNewTask({
        title: '',
        description: '',
        categoryId: categories[0]?.id || '',
        wardId: user?.wardId || wards[0]?.id || '',
        assignedTo: user?.id || '',
        priority: 'Medium',
        dueDate: new Date(Date.now() + 2 * 3600 * 1000).toISOString().slice(0, 16),
        recurrence: 'NONE',
        patientReference: '',
        instructions: '',
      });
      loadData();
    } catch (err: any) {
      error(err.message || 'Failed to create task');
    }
  };

  const handleUpdateStatus = async (status: string, notes?: string) => {
    if (!selectedTask) return;
    try {
      await api.updateTaskStatus(selectedTask.id, status, notes);
      success(`Task marked as ${status}`);
      setIsCompleteModalOpen(false);
      setCompletionNotes('');
      const updated = await api.getTaskById(selectedTask.id);
      setSelectedTask(updated);
      loadData();
    } catch (err: any) {
      error(err.message || 'Failed to update status');
    }
  };

  const handleReassign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask || !newAssigneeId) return;
    try {
      await api.reassignTask(selectedTask.id, newAssigneeId, reassignReason);
      success('Task reassigned successfully.');
      setIsReassignModalOpen(false);
      setReassignReason('');
      const updated = await api.getTaskById(selectedTask.id);
      setSelectedTask(updated);
      loadData();
    } catch (err: any) {
      error(err.message || 'Failed to reassign task');
    }
  };

  const handleEscalate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask) return;
    try {
      await api.escalateTask(selectedTask.id, escalateReason);
      warning('Task escalated to Clinical Supervisor.');
      setIsEscalateModalOpen(false);
      setEscalateReason('');
      const updated = await api.getTaskById(selectedTask.id);
      setSelectedTask(updated);
      loadData();
    } catch (err: any) {
      error(err.message || 'Failed to escalate task');
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask || !newComment.trim()) return;
    try {
      await api.addTaskComment(selectedTask.id, newComment.trim());
      setNewComment('');
      const updated = await api.getTaskById(selectedTask.id);
      setSelectedTask(updated);
    } catch (err: any) {
      error(err.message || 'Failed to add comment');
    }
  };

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      <PageHeader
        title="Clinical Task Management"
        subtitle="Schedule, execute, reassign and audit bedside nursing care procedures"
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Tasks' }]}
        actions={
          (isSupervisor || isAdmin) && (
            <Button
              variant="primary"
              size="sm"
              icon={<Plus className="w-4 h-4" />}
              onClick={() => setIsCreateOpen(true)}
            >
              Create New Task
            </Button>
          )
        }
      />

      {/* Tabs: My Shift Tasks vs All Ward Tasks */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('my')}
          className={`pb-3 px-4 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'my'
              ? 'border-teal-700 text-teal-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <CheckSquare className="w-4 h-4" />
          My Assigned Shift Tasks
        </button>
        <button
          onClick={() => setActiveTab('all')}
          className={`pb-3 px-4 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'all'
              ? 'border-teal-700 text-teal-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Building2 className="w-4 h-4" />
          All Ward & Inpatient Tasks
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-3.5 rounded-clinical border border-slate-200 shadow-sm flex flex-wrap items-center gap-2.5 text-xs">
        <div className="relative flex-1 min-w-[200px]">
          <input
            type="text"
            placeholder="Search task title, patient UHID or notes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 rounded-clinical border border-slate-300 text-xs focus:ring-1 focus:ring-teal-600 focus:outline-none"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-2.5 py-1.5 rounded-clinical border border-slate-300 text-xs text-slate-700 bg-white"
        >
          <option value="ALL">All Statuses</option>
          <option value="Pending">Pending</option>
          <option value="In Progress">In Progress</option>
          <option value="Completed">Completed</option>
          <option value="Cancelled">Cancelled</option>
        </select>

        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="px-2.5 py-1.5 rounded-clinical border border-slate-300 text-xs text-slate-700 bg-white"
        >
          <option value="ALL">All Priorities</option>
          <option value="Urgent">Urgent</option>
          <option value="High">High</option>
          <option value="Medium">Medium</option>
          <option value="Low">Low</option>
        </select>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-2.5 py-1.5 rounded-clinical border border-slate-300 text-xs text-slate-700 bg-white"
        >
          <option value="ALL">All Categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        {activeTab === 'all' && (
          <select
            value={wardFilter}
            onChange={(e) => setWardFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-clinical border border-slate-300 text-xs text-slate-700 bg-white"
          >
            <option value="ALL">All Wards</option>
            {wards.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </select>
        )}

        <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer ml-auto">
          <input
            type="checkbox"
            checked={overdueOnly}
            onChange={(e) => setOverdueOnly(e.target.checked)}
            className="rounded text-teal-700 focus:ring-teal-500"
          />
          <span className="font-medium text-red-700">Overdue Only</span>
        </label>
      </div>

      {/* Main Task Table */}
      {isLoading ? (
        <LoadingSkeleton rows={8} />
      ) : (
        <div className="bg-white rounded-clinical border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100/70 text-slate-600 border-b border-slate-200 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-2.5 px-4">Task Specification</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3">Patient / Bed</th>
                  <th className="py-2.5 px-3">Ward</th>
                  <th className="py-2.5 px-3">Assigned Nurse</th>
                  <th className="py-2.5 px-3">Priority</th>
                  <th className="py-2.5 px-3">Deadline</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tasks.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-400">
                      No clinical tasks matching the specified criteria.
                    </td>
                  </tr>
                ) : (
                  tasks.map((task) => {
                    const isOverdue =
                      task.status !== 'Completed' &&
                      task.status !== 'Cancelled' &&
                      new Date(task.due_date).getTime() < Date.now();

                    return (
                      <tr
                        key={task.id}
                        onClick={() => openTaskDetails(task)}
                        className={`hover:bg-slate-50/80 cursor-pointer transition-colors ${
                          isOverdue ? 'bg-red-50/20' : ''
                        }`}
                      >
                        <td className="py-3 px-4 font-medium text-slate-900 max-w-xs">
                          <div className="flex items-center gap-1.5">
                            {task.escalated === 1 && (
                              <span className="px-1.5 py-0.2 bg-red-100 text-red-800 text-[10px] font-bold rounded">
                                ESCALATED
                              </span>
                            )}
                            <span className="truncate">{task.title}</span>
                          </div>
                          {task.instructions && (
                            <p className="text-[11px] text-slate-500 truncate mt-0.5">
                              {task.instructions}
                            </p>
                          )}
                        </td>
                        <td className="py-3 px-3 text-slate-600 whitespace-nowrap">
                          {task.category_name}
                        </td>
                        <td className="py-3 px-3 text-slate-700 font-medium whitespace-nowrap">
                          {task.patient_reference || 'Ward General'}
                        </td>
                        <td className="py-3 px-3 text-slate-600 whitespace-nowrap">
                          {task.ward_name}
                        </td>
                        <td className="py-3 px-3 text-slate-700 whitespace-nowrap">
                          Sister {task.assigned_to_name}
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap">
                          <Badge
                            variant={
                              task.priority === 'Urgent'
                                ? 'urgent'
                                : task.priority === 'High'
                                ? 'high'
                                : task.priority === 'Medium'
                                ? 'medium'
                                : 'low'
                            }
                            dot
                          >
                            {task.priority}
                          </Badge>
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap font-mono">
                          <span className={isOverdue ? 'text-red-700 font-bold' : 'text-slate-600'}>
                            {new Date(task.due_date).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap">
                          <Badge
                            variant={
                              task.status === 'Completed'
                                ? 'completed'
                                : task.status === 'In Progress'
                                ? 'in_progress'
                                : task.status === 'Cancelled'
                                ? 'cancelled'
                                : 'pending'
                            }
                          >
                            {task.status}
                          </Badge>
                        </td>
                        <td
                          className="py-3 px-4 text-right whitespace-nowrap"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex items-center justify-end gap-1.5">
                            {task.status === 'Pending' && (
                              <button
                                onClick={async () => {
                                  await api.updateTaskStatus(task.id, 'In Progress');
                                  loadData();
                                }}
                                className="px-2 py-1 text-xs font-semibold text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded"
                              >
                                Start
                              </button>
                            )}
                            {task.status === 'In Progress' && (
                              <button
                                onClick={() => {
                                  setSelectedTask(task);
                                  setIsCompleteModalOpen(true);
                                }}
                                className="px-2 py-1 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded"
                              >
                                Complete
                              </button>
                            )}
                            <button
                              onClick={() => openTaskDetails(task)}
                              className="px-2 py-1 text-xs text-slate-500 hover:text-slate-700"
                            >
                              Inspect
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Task Details Side Drawer with Activity Timeline & Comments */}
      {selectedTask && (
        <Drawer
          isOpen={isDetailsOpen}
          onClose={() => setIsDetailsOpen(false)}
          title={`Clinical Task #${selectedTask.id.slice(0, 8)}`}
          subtitle={`Created by ${selectedTask.created_by_name}`}
          width="xl"
        >
          <div className="space-y-6 text-xs">
            {/* Title & Priority Header */}
            <div className="border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2 mb-1.5">
                <Badge
                  variant={
                    selectedTask.priority === 'Urgent'
                      ? 'urgent'
                      : selectedTask.priority === 'High'
                      ? 'high'
                      : selectedTask.priority === 'Medium'
                      ? 'medium'
                      : 'low'
                  }
                  dot
                >
                  {selectedTask.priority} Priority
                </Badge>
                <Badge
                  variant={
                    selectedTask.status === 'Completed'
                      ? 'completed'
                      : selectedTask.status === 'In Progress'
                      ? 'in_progress'
                      : 'pending'
                  }
                >
                  {selectedTask.status}
                </Badge>
                {selectedTask.escalated === 1 && (
                  <Badge variant="urgent">Escalated</Badge>
                )}
              </div>
              <h2 className="text-base font-bold text-slate-900">{selectedTask.title}</h2>
              {selectedTask.description && (
                <p className="text-slate-600 mt-1 leading-relaxed">{selectedTask.description}</p>
              )}
            </div>

            {/* Clinical Specifications Grid */}
            <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-clinical border border-slate-200">
              <div>
                <span className="text-slate-400 block text-[11px]">Patient / Bed Reference</span>
                <span className="font-semibold text-slate-800">
                  {selectedTask.patient_reference || 'General Ward Care'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Category</span>
                <span className="font-semibold text-slate-800">
                  {selectedTask.category_name}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Ward Location</span>
                <span className="font-semibold text-slate-800">{selectedTask.ward_name}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Assigned Staff Nurse</span>
                <span className="font-semibold text-slate-800">
                  Sister {selectedTask.assigned_to_name} ({selectedTask.assigned_to_emp_id})
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Due Deadline</span>
                <span className="font-semibold font-mono text-slate-800">
                  {new Date(selectedTask.due_date).toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Recurrence</span>
                <span className="font-semibold text-slate-800">
                  {selectedTask.recurrence || 'NONE'}
                </span>
              </div>
            </div>

            {/* Special Instructions & Completion Notes */}
            {selectedTask.instructions && (
              <div className="p-3 bg-teal-50/60 border border-teal-200 rounded-clinical">
                <span className="font-semibold text-teal-900 block mb-1">
                  Physician / Nursing Instructions:
                </span>
                <p className="text-teal-800 leading-relaxed">{selectedTask.instructions}</p>
              </div>
            )}

            {selectedTask.completion_notes && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-clinical">
                <span className="font-semibold text-emerald-900 block mb-1">
                  Completion Documentation:
                </span>
                <p className="text-emerald-800 leading-relaxed">{selectedTask.completion_notes}</p>
                <span className="text-[10px] text-emerald-700 block mt-1">
                  Completed by Sister {selectedTask.completed_by_name} at{' '}
                  {new Date(selectedTask.completed_at || '').toLocaleTimeString()}
                </span>
              </div>
            )}

            {/* Action Bar for Status, Reassign, Escalate */}
            <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
              {selectedTask.status !== 'Completed' && (
                <>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setIsCompleteModalOpen(true)}
                    icon={<CheckCircle2 className="w-3.5 h-3.5" />}
                  >
                    Mark Completed
                  </Button>
                  {(isSupervisor || isAdmin) && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsReassignModalOpen(true)}
                      icon={<ArrowRightLeft className="w-3.5 h-3.5" />}
                    >
                      Reassign
                    </Button>
                  )}
                  {selectedTask.escalated === 0 && (
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => setIsEscalateModalOpen(true)}
                      icon={<Flame className="w-3.5 h-3.5" />}
                    >
                      Escalate Task
                    </Button>
                  )}
                </>
              )}
            </div>

            {/* Clinical Notes & Comments Thread */}
            <div className="border-t border-slate-100 pt-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3 flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-teal-700" />
                Shift Communication & Clinical Notes
              </h3>

              <div className="space-y-2 mb-3">
                {selectedTask.comments?.length === 0 ? (
                  <p className="text-slate-400 italic">No comments or notes added yet.</p>
                ) : (
                  selectedTask.comments?.map((c) => (
                    <div key={c.id} className="p-2.5 rounded bg-slate-50 border border-slate-200">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-slate-800">
                          {c.user_name} ({c.role_name})
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-slate-700 leading-relaxed">{c.comment}</p>
                    </div>
                  ))
                )}
              </div>

              <form onSubmit={handleAddComment} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Add a clinical comment or patient update..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="flex-1 px-3 py-1.5 text-xs rounded-clinical border border-slate-300 focus:ring-1 focus:ring-teal-600 focus:outline-none"
                />
                <Button type="submit" variant="secondary" size="sm" icon={<Send className="w-3 h-3" />}>
                  Post
                </Button>
              </form>
            </div>

            {/* Audit Activity Timeline */}
            <div className="border-t border-slate-100 pt-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3 flex items-center gap-1.5">
                <History className="w-3.5 h-3.5 text-slate-500" />
                Task Audit History Timeline
              </h3>

              <div className="space-y-2 relative pl-4 border-l-2 border-slate-200">
                {selectedTask.history?.map((h) => (
                  <div key={h.id} className="relative text-[11px]">
                    <span className="w-2 h-2 rounded-full bg-teal-600 absolute -left-[21px] top-1" />
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-800">{h.action}</span>
                      <span className="text-slate-400 font-mono">
                        {new Date(h.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-slate-600">{h.details}</p>
                    <span className="text-[10px] text-slate-400">By {h.user_name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Drawer>
      )}

      {/* Create Task Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Create & Assign Clinical Task"
        subtitle="Specify patient care details, clinical priority, and assigned staff nurse"
        maxWidth="xl"
      >
        <form onSubmit={handleCreateTask} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Task Title / Intervention *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Administer IV Ceftriaxone 1g slow infusion"
              value={newTask.title}
              onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
              className="w-full px-3 py-2 rounded-clinical border border-slate-300 focus:ring-1 focus:ring-teal-600 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Category *</label>
              <select
                required
                value={newTask.categoryId}
                onChange={(e) => setNewTask({ ...newTask, categoryId: e.target.value })}
                className="w-full px-3 py-2 rounded-clinical border border-slate-300 focus:ring-1 focus:ring-teal-600 focus:outline-none"
              >
                <option value="">Select Category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Ward *</label>
              <select
                required
                value={newTask.wardId}
                onChange={(e) => setNewTask({ ...newTask, wardId: e.target.value })}
                className="w-full px-3 py-2 rounded-clinical border border-slate-300 focus:ring-1 focus:ring-teal-600 focus:outline-none"
              >
                <option value="">Select Ward</option>
                {wards.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Assign Nurse *</label>
              <select
                required
                value={newTask.assignedTo}
                onChange={(e) => setNewTask({ ...newTask, assignedTo: e.target.value })}
                className="w-full px-3 py-2 rounded-clinical border border-slate-300 focus:ring-1 focus:ring-teal-600 focus:outline-none"
              >
                <option value="">Select Staff Nurse</option>
                {staffList.map((s) => (
                  <option key={s.id} value={s.id}>
                    Sister {s.name} ({s.employeeId})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Clinical Priority</label>
              <select
                value={newTask.priority}
                onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                className="w-full px-3 py-2 rounded-clinical border border-slate-300 focus:ring-1 focus:ring-teal-600 focus:outline-none font-medium"
              >
                <option value="Low">Low Priority</option>
                <option value="Medium">Medium Priority</option>
                <option value="High">High Priority</option>
                <option value="Urgent">Urgent Priority (Immediate)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Due Deadline *</label>
              <input
                type="datetime-local"
                required
                value={newTask.dueDate}
                onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                className="w-full px-3 py-2 rounded-clinical border border-slate-300 focus:ring-1 focus:ring-teal-600 focus:outline-none font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Patient / Bed Reference</label>
              <input
                type="text"
                placeholder="e.g. Bed 4 - Mr. Gopal Das (UHID-2026-8912)"
                value={newTask.patientReference}
                onChange={(e) => setNewTask({ ...newTask, patientReference: e.target.value })}
                className="w-full px-3 py-2 rounded-clinical border border-slate-300 focus:ring-1 focus:ring-teal-600 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Clinical Instructions / Precautions
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Infuse over 30 mins. Check IV cannula patency and allergy status."
              value={newTask.instructions}
              onChange={(e) => setNewTask({ ...newTask, instructions: e.target.value })}
              className="w-full px-3 py-2 rounded-clinical border border-slate-300 focus:ring-1 focus:ring-teal-600 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
            <Button variant="outline" size="sm" type="button" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit">
              Create & Assign Task
            </Button>
          </div>
        </form>
      </Modal>

      {/* Complete Task Modal */}
      <Modal
        isOpen={isCompleteModalOpen}
        onClose={() => setIsCompleteModalOpen(false)}
        title="Complete Clinical Task"
        subtitle="Document completion notes and clinical outcome"
        maxWidth="md"
      >
        <div className="space-y-4 text-xs">
          <p className="text-slate-600">
            You are signing off task &ldquo;<strong>{selectedTask?.title}</strong>&rdquo; for{' '}
            {selectedTask?.patient_reference || 'Ward'}.
          </p>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Completion Notes / Findings
            </label>
            <textarea
              rows={3}
              placeholder="e.g. Medication infused without adverse reaction. Vitals post-infusion: BP 120/80, SpO2 98%."
              value={completionNotes}
              onChange={(e) => setCompletionNotes(e.target.value)}
              className="w-full px-3 py-2 rounded-clinical border border-slate-300 focus:ring-1 focus:ring-teal-600 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button variant="outline" size="sm" onClick={() => setIsCompleteModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => handleUpdateStatus('Completed', completionNotes)}
            >
              Sign Off & Complete
            </Button>
          </div>
        </div>
      </Modal>

      {/* Reassign Task Modal */}
      <Modal
        isOpen={isReassignModalOpen}
        onClose={() => setIsReassignModalOpen(false)}
        title="Reassign Clinical Task"
        subtitle="Transfer task responsibility to another on-duty nurse"
        maxWidth="md"
      >
        <form onSubmit={handleReassign} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">New Staff Nurse *</label>
            <select
              required
              value={newAssigneeId}
              onChange={(e) => setNewAssigneeId(e.target.value)}
              className="w-full px-3 py-2 rounded-clinical border border-slate-300 focus:ring-1 focus:ring-teal-600 focus:outline-none"
            >
              <option value="">Select Nurse</option>
              {staffList.map((s) => (
                <option key={s.id} value={s.id}>
                  Sister {s.name} ({s.employeeId})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Reason for Clinical Reassignment
            </label>
            <input
              type="text"
              placeholder="e.g. Workload balancing, emergency procedure assist"
              value={reassignReason}
              onChange={(e) => setReassignReason(e.target.value)}
              className="w-full px-3 py-2 rounded-clinical border border-slate-300 focus:ring-1 focus:ring-teal-600 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button variant="outline" size="sm" type="button" onClick={() => setIsReassignModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit">
              Confirm Reassignment
            </Button>
          </div>
        </form>
      </Modal>

      {/* Escalate Task Modal */}
      <Modal
        isOpen={isEscalateModalOpen}
        onClose={() => setIsEscalateModalOpen(false)}
        title="Escalate Operational / Clinical Task"
        subtitle="Flags task as urgent and immediately alerts Head Nurse & Clinical Supervisor"
        maxWidth="md"
      >
        <form onSubmit={handleEscalate} className="space-y-4 text-xs">
          <div className="p-3 bg-red-50 border border-red-200 rounded text-red-800">
            Escalating will notify the Shift Supervisor and elevate priority to <strong>Urgent</strong>.
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Reason for Escalation *
            </label>
            <textarea
              required
              rows={3}
              placeholder="e.g. Patient deterioration, vital signs instability, missing pharmacy drug, IV line failed."
              value={escalateReason}
              onChange={(e) => setEscalateReason(e.target.value)}
              className="w-full px-3 py-2 rounded-clinical border border-slate-300 focus:ring-1 focus:ring-red-600 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button variant="outline" size="sm" type="button" onClick={() => setIsEscalateModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" size="sm" type="submit">
              Escalate Immediately
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
