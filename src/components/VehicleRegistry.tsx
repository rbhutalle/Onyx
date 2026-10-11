import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { 
  Car, 
  Plus, 
  CheckCircle, 
  AlertCircle, 
  X,
  Edit2,
  Trash2,
  Save,
  Loader2
} from 'lucide-react';

interface VehicleRecord {
  vehicle_id: string;
  plate_no: string;
  service_rdg: number | null;
  model_id: string | null;
  [key: string]: unknown;
}

export function VehicleRegistry() {
  const [vehicles, setVehicles] = useState<VehicleRecord[]>([]);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [vehicleForm, setVehicleForm] = useState({ 
    plate_no: '', 
    service_rdg: '' 
  });

  useEffect(() => {
    let isMounted = true;

    async function loadVehicles() {
      try {
        setErrorMsg(null);
        const { data, error } = await supabase
          .from('vehicles')
          .select('*')
          .order('plate_no', { ascending: true });

        if (error) throw error;
        if (isMounted) {
          setVehicles(data || []);
        }
      } catch (err: unknown) {
        console.error('Error fetching vehicles:', err);
        if (isMounted) {
          setErrorMsg('Failed to load vehicle registry data. Please check table permissions.');
        }
      }
    }

    loadVehicles();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleOpenAdd = () => {
    setEditingId(null);
    setVehicleForm({ plate_no: '', service_rdg: '' });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: VehicleRecord) => {
    setEditingId(item.vehicle_id);
    setVehicleForm({
      plate_no: item.plate_no || '',
      service_rdg: item.service_rdg !== null ? String(item.service_rdg) : '',
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this vehicle?')) return;
    try {
      setErrorMsg(null);
      const { error } = await supabase
        .from('vehicles')
        .delete()
        .eq('vehicle_id', id);

      if (error) throw error;

      setSuccessMsg('Vehicle deleted successfully!');
      setTimeout(() => setSuccessMsg(null), 3000);
      window.location.reload();
    } catch (err: unknown) {
      console.error('Error deleting record:', err);
      setErrorMsg('Failed to delete record. Check foreign key constraints.');
    }
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehicleForm.plate_no.trim()) {
      setErrorMsg('Plate number is required.');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    try {
      const payload = { 
        plate_no: vehicleForm.plate_no.trim(), 
        service_rdg: vehicleForm.service_rdg !== '' ? Number(vehicleForm.service_rdg) : 0 
      };

      if (editingId) {
        const { error } = await supabase
          .from('vehicles')
          .update(payload)
          .eq('vehicle_id', editingId);

        if (error) throw error;
        setSuccessMsg('Vehicle updated successfully!');
      } else {
        const { error } = await supabase
          .from('vehicles')
          .insert([payload]);

        if (error) throw error;
        setSuccessMsg('Vehicle registered successfully!');
      }

      setIsModalOpen(false);
      setTimeout(() => setSuccessMsg(null), 4000);
      window.location.reload(); 
    } catch (err: unknown) {
      console.error('Error saving record:', err);
      setErrorMsg('Failed to save record. Please check required fields or constraints.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 w-full max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
        <div className="p-2.5 bg-blue-600/20 text-blue-400 rounded-xl">
          <Car className="w-7 h-7" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100">Vehicle Registry</h1>
          <p className="text-sm text-slate-400">Manage fleet vehicles, default service readings, and base properties.</p>
        </div>
      </div>

      {successMsg && (
        <div className="bg-emerald-950/50 border border-emerald-800 text-emerald-200 px-4 py-3 rounded-lg flex items-center gap-3 text-sm">
          <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="bg-red-950/50 border border-red-800 text-red-200 px-4 py-3 rounded-lg flex items-center gap-3 text-sm">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="flex border-b border-slate-800 gap-2">
        <div className="flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 border-blue-500 text-blue-400 bg-blue-950/20">
          <Car className="w-4 h-4" />
          <span>Registered Vehicles ({vehicles.length})</span>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-4">
        <div className="flex justify-end items-center gap-4">
          <button
            onClick={handleOpenAdd}
            className="bg-blue-600 hover:bg-blue-500 text-white px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow"
          >
            <Plus className="w-4 h-4" />
            <span>Add Vehicle</span>
          </button>
        </div>

        <div className="overflow-y-auto overflow-x-auto max-h-[calc(100vh-360px)] border border-slate-800/60 rounded-lg">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 text-xs uppercase bg-slate-950 sticky top-0 z-10 shadow-xs">
                <th className="p-3">Plate No</th>
                <th className="p-3">Service Reading</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {vehicles.length === 0 ? (
                <tr>
                  <td colSpan={3} className="p-8 text-center text-slate-500">No vehicles registered.</td>
                </tr>
              ) : (
                vehicles.map((item) => (
                  <tr key={item.vehicle_id} className="hover:bg-slate-950/40 transition-colors">
                    <td className="p-3 font-semibold text-slate-100">{item.plate_no}</td>
                    <td className="p-3 font-mono text-slate-300">{item.service_rdg ?? '0'}</td>
                    <td className="p-3 text-right space-x-3">
                      <button
                        onClick={() => handleOpenEdit(item)}
                        className="text-xs text-blue-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" /> Edit
                      </button>
                      <button
                        onClick={() => handleDelete(item.vehicle_id)}
                        className="text-xs text-red-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-lg font-bold text-slate-100">
                {editingId ? 'Edit Vehicle' : 'Add Vehicle'}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Plate No <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  required
                  value={vehicleForm.plate_no}
                  onChange={(e) => setVehicleForm({ ...vehicleForm, plate_no: e.target.value })}
                  placeholder="e.g. ABC1234"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500 font-semibold"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Service Reading</label>
                <input
                  type="number"
                  step="any"
                  value={vehicleForm.service_rdg}
                  onChange={(e) => setVehicleForm({ ...vehicleForm, service_rdg: e.target.value })}
                  placeholder="e.g. 0.00"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>{editingId ? 'Update Vehicle' : 'Save Vehicle'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default VehicleRegistry;