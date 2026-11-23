import { useState, useEffect } from 'react';
import axiosClient from '../../api/axiosClient';
import toast from 'react-hot-toast';
import { Plus, Trash2, Edit3, Clock, Shield, Boxes } from 'lucide-react';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import FormField from '../../components/ui/FormField';
import Skeleton from '../../components/common/Skeleton';
import EmptyState from '../../components/common/EmptyState';

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
  const [submitting, setSubmitting] = useState(false);

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
      toast.error('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const formatPrice = (price) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'VND' }).format(price);

  const formatDuration = (days) => {
    if (days >= 365) return '1 year';
    if (days >= 180) return '6 months';
    if (days >= 90) return '3 months';
    return `${days} days`;
  };

  // Validate before enabling submit so incomplete or negative values are blocked.
  const durationValue = Number(form.duration_days);
  const priceValue = Number(form.price);
  const isDurationValid =
    form.duration_days !== '' && Number.isFinite(durationValue) && durationValue > 0;
  const isPriceValid = form.price !== '' && Number.isFinite(priceValue) && priceValue >= 0;
  const isFormValid = form.name.trim() !== '' && isDurationValid && isPriceValid;

  function openCreateModal() {
    setEditingId(null);
    setForm({ name: '', duration_days: '', price: '', status: 'active' });
    setModalOpen(true);
  }

  function openEditModal(plan) {
    setEditingId(plan.id);
    setForm({ name: plan.name, duration_days: String(plan.duration_days), price: String(plan.price), status: plan.status });
    setModalOpen(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!isFormValid) {
      toast.error('Something went wrong. Please try again.');
      return;
    }

    setSubmitting(true);
    try {
      if (editingId) {
        await axiosClient.put(`/plans/${editingId}`, {
          name: form.name.trim(),
          duration_days: Number(form.duration_days),
          price: Number(form.price),
          status: form.status,
        });
      } else {
        await axiosClient.post('/plans', {
          name: form.name.trim(),
          duration_days: Number(form.duration_days),
          price: Number(form.price),
          status: form.status,
        });
      }
      setModalOpen(false);
      toast.success('Saved successfully.');
      await fetchPlans();
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Are you sure you want to delete this plan?')) return;
    try {
      await axiosClient.delete(`/plans/${id}`);
      toast.success('Saved successfully.');
      await fetchPlans();
    } catch {
      toast.error('Something went wrong. Please try again.');
    }
  }

  return (
    <div className="min-h-screen bg-[#f4f6f3]">
      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-ink">Membership Plans</h1>
            <p className="text-sm text-muted">Manage gym membership packages.</p>
          </div>
          <Button className="w-full md:w-auto" onClick={openCreateModal}>
            <Plus size={18} /> Add Plan
          </Button>
        </div>

        <div className="rounded-xl border border-[#e3e9e1] bg-white shadow-card">
          {loading ? (
            <div className="space-y-3 p-5" aria-label="Loading plans">
              {[0, 1, 2, 3].map((item) => (
                <Skeleton className="h-12 w-full" key={item} />
              ))}
            </div>
          ) : plans.length === 0 ? (
            <EmptyState
              action={<Button onClick={openCreateModal}><Plus size={18} /> Add Plan</Button>}
              description="Add your first plan so members can sign up."
              icon={Boxes}
              title="No data yet"
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-[#e3e9e1] bg-[#f4f6f3]">
                    <th className="px-4 py-3 text-sm font-semibold text-muted">Name</th>
                    <th className="px-4 py-3 text-sm font-semibold text-muted">Duration</th>
                    <th className="px-4 py-3 text-sm font-semibold text-muted">Price</th>
                    <th className="px-4 py-3 text-sm font-semibold text-muted">Status</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-muted">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e3e9e1]">
                  {plans.map((plan) => (
                    <tr key={plan.id} className="transition-colors hover:bg-[#f4f6f3]/50">
                      <td className="px-4 py-3 text-sm font-medium text-ink">{plan.name}</td>
                      <td className="px-4 py-3 text-sm text-muted">{formatDuration(plan.duration_days)}</td>
                      <td className="px-4 py-3 text-sm font-medium text-ink">{formatPrice(plan.price)}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${plan.status === 'active' ? 'bg-[#9aca42]/10 text-[#9aca42]' : 'bg-[#6a8a66]/10 text-[#6a8a66]'}`}>
                          {plan.status === 'active' ? <Shield size={12} /> : <Clock size={12} />}
                          {plan.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-sm">
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
          )}
        </div>

        {/* Modal */}
        <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? 'Edit Plan' : 'Add New Plan'} size="md">
          <form className="space-y-4" onSubmit={handleSubmit}>
            <FormField label="Plan Name" required>
              <Input
                error={form.name.length > 0 && form.name.trim() === ''}
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </FormField>

            <div className="flex flex-col gap-4 md:flex-row">
              <div className="flex-1">
                <FormField label="Duration (days)" required hint="e.g. 30, 90, 180, 365">
                  <Input
                    error={form.duration_days !== '' && !isDurationValid}
                    min={1}
                    required
                    type="number"
                    value={form.duration_days}
                    onChange={(e) => setForm({ ...form, duration_days: e.target.value })}
                  />
                </FormField>
              </div>
              <div className="flex-1">
                <FormField label="Price (VND)" required>
                  <Input
                    error={form.price !== '' && !isPriceValid}
                    min={0}
                    required
                    type="number"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                  />
                </FormField>
              </div>
            </div>

            <FormField label="Status">
              <Select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              >
                <option value="active">Active</option>
                <option value="hidden">Hidden</option>
              </Select>
            </FormField>

            {!isFormValid && (
              <p className="text-xs text-red-600">
                Enter a name, a positive duration and a non-negative price.
              </p>
            )}

            <div className="flex flex-col gap-3 pt-4 sm:flex-row sm:justify-end">
              <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
              <Button disabled={!isFormValid} loading={submitting} type="submit">
                {editingId ? 'Update Plan' : 'Create Plan'}
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </div>
  );
}
