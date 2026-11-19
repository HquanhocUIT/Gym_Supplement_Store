import { useState, useEffect } from 'react';
import axiosClient from '../../api/axiosClient';
import { Plus, Trash2, Edit3, Clock, Shield } from 'lucide-react';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import FormField from '../../components/ui/FormField';

/**
 * PlanManagement - Admin page to manage membership plans.
 * Calls GET /plans to list plans.
 * POST /plans to create, PUT /plans/:id to update, DELETE /plans/:id to delete.
 * Uses mock data fallback if API fails.
 */
const MOCK_PLANS = [
  { id: 1, name: '1 Month Pass', duration_days: 30, price: 250000, status: 'active' },
  { id: 2, name: '3 Month Pass', duration_days: 90, price: 690000, status: 'active' },
  { id: 3, name: '6 Month Pass', duration_days: 180, price: 1290000, status: 'active' },
  { id: 4, name: '1 Year Pass', duration_days: 365, price: 2390000, status: 'active' },
];

export default function PlanManagement() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ name: '', duration_days: '', price: '', status: 'active' });
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPlans();
  }, []);

  async function fetchPlans() {
    try {
      const response = await axiosClient.get('/plans');
      if (response.data?.data && Array.isArray(response.data.data)) {
        setPlans(response.data.data);
      } else {
        setPlans(MOCK_PLANS);
      }
    } catch {
      setPlans(MOCK_PLANS);
    } finally {
      setLoading(false);
    }
  }

  const formatPrice = (price) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);

  const formatDuration = (days) => {
    if (days >= 365) return '1 year';
    if (days >= 180) return '6 months';
    if (days >= 90) return '3 months';
    return `${days} days`;
  };

  function openCreateModal() {
    setEditingId(null);
    setForm({ name: '', duration_days: '', price: '', status: 'active' });
    setError('');
    setModalOpen(true);
  }

  function openEditModal(plan) {
    setEditingId(plan.id);
    setForm({ name: plan.name, duration_days: String(plan.duration_days), price: String(plan.price), status: plan.status });
    setError('');
    setModalOpen(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    try {
      if (editingId) {
        await axiosClient.put(`/plans/${editingId}`, {
          name: form.name,
          duration_days: Number(form.duration_days),
          price: Number(form.price),
          status: form.status,
        });
      } else {
        await axiosClient.post('/plans', {
          name: form.name,
          duration_days: Number(form.duration_days),
          price: Number(form.price),
          status: form.status,
        });
      }
      setModalOpen(false);
      await fetchPlans();
    } catch (err) {
      setError(err.message || 'Failed to save plan.');
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Are you sure you want to delete this plan?')) return;
    try {
      await axiosClient.delete(`/plans/${id}`);
      await fetchPlans();
    } catch (err) {
      setError(err.message || 'Failed to delete plan.');
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f4f6f3]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#84cc16]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f6f3]">
      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-ink">Membership Plans</h1>
            <p className="text-sm text-muted">Manage gym membership packages.</p>
          </div>
          <Button onClick={openCreateModal}>
            <Plus size={18} /> Add Plan
          </Button>
        </div>

        <div className="rounded-xl border border-[#e3e9e1] bg-white shadow-card">
          <div className="overflow-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#e3e9e1] bg-[#f4f6f3]">
                  <th className="px-4 py-3 text-sm font-semibold text-muted">Name</th>
                  <th className="px-4 py-3 text-sm font-semibold text-muted">Duration</th>
                  <th className="px-4 py-3 text-sm font-semibold text-muted">Price</th>
                  <th className="px-4 py-3 text-sm font-semibold text-muted">Status</th>
                  <th className="px-4 py-3 text-sm font-semibold text-muted text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e3e9e1]">
                {plans.map((plan) => (
                  <tr key={plan.id} className="hover:bg-[#f4f6f3]/50 transition-colors">
                    <td className="px-4 py-3 text-sm text-ink font-medium">{plan.name}</td>
                    <td className="px-4 py-3 text-sm text-muted">{formatDuration(plan.duration_days)}</td>
                    <td className="px-4 py-3 text-sm font-medium text-ink">{formatPrice(plan.price)}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${plan.status === 'active' ? 'bg-[#9aca42]/10 text-[#9aca42]' : 'bg-[#6a8a66]/10 text-[#6a8a66]'}`}>
                        {plan.status === 'active' ? <Shield size={12} /> : <Clock size={12} />}
                        {plan.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-right">
                      <Button variant="ghost" size="sm" onClick={() => openEditModal(plan)} className="mr-2">
                        <Edit3 size={16} /> Edit
                      </Button>
                      <Button variant="danger" size="sm" onClick={() => handleDelete(plan.id)}>
                        <Trash2 size={16} /> Delete
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {plans.length === 0 && (
          <div className="mt-8 text-center text-muted">
            <p>No membership plans found.</p>
          </div>
        )}

        {/* Modal */}
        <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? 'Edit Plan' : 'Add New Plan'} size="md">
          <form onSubmit={handleSubmit} className="space-y-4">
            <FormField label="Plan Name" required>
              <Input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </FormField>

            <FormField label="Duration (days)" required hint="e.g. 30, 90, 180, 365">
              <Input
                type="number"
                required
                value={form.duration_days}
                onChange={(e) => setForm({ ...form, duration_days: e.target.value })}
              />
            </FormField>

            <FormField label="Price (VND)" required>
              <Input
                type="number"
                required
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
              />
            </FormField>

            <FormField label="Status">
              <Select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              >
                <option value="active">Active</option>
                <option value="hidden">Hidden</option>
              </Select>
            </FormField>

            {error && <div className="text-sm text-red-600 bg-red-50/50 px-3 py-2 rounded border border-red-100">{error}</div>}

            <div className="flex justify-end gap-3 pt-4">
              <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
              <Button type="submit">{editingId ? 'Update Plan' : 'Create Plan'}</Button>
            </div>
          </form>
        </Modal>
      </div>
    </div>
  );
}
