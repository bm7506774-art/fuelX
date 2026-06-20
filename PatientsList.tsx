import { useEffect, useState } from 'react';
import {
  Plus,
  Search,
  Filter,
  User,
  Phone,
  Mail,
  MoreVertical,
  Edit,
  Trash2,
  Eye
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Patient } from '../types/database';
import PatientForm from './PatientForm';

interface PatientsListProps {
  onSelectPatient: (id: string) => void;
}

export default function PatientsList({ onSelectPatient }: PatientsListProps) {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  useEffect(() => {
    loadPatients();
  }, []);

  const loadPatients = async () => {
    try {
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPatients(data || []);
    } catch (error) {
      console.error('Error loading patients:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا العميل؟')) return;

    try {
      const { error } = await supabase.from('patients').delete().eq('id', id);
      if (error) throw error;
      setPatients(patients.filter((p) => p.id !== id));
    } catch (error) {
      console.error('Error deleting patient:', error);
    }
  };

  const filteredPatients = patients.filter((patient) =>
    patient.name.includes(searchQuery) ||
    patient.phone?.includes(searchQuery) ||
    patient.email?.includes(searchQuery)
  );

  const calculateBMI = (weight: number | null, height: number | null) => {
    if (!weight || !height) return null;
    const bmi = weight / ((height / 100) ** 2);
    return bmi.toFixed(1);
  };

  const getBMICategory = (bmi: number) => {
    if (bmi < 18.5) return { label: 'نقص وزن', color: 'text-blue-600' };
    if (bmi < 25) return { label: 'طبيعي', color: 'text-emerald-600' };
    if (bmi < 30) return { label: 'زيادة وزن', color: 'text-amber-600' };
    return { label: 'سمنة', color: 'text-red-600' };
  };

  if (showForm) {
    return (
      <PatientForm
        patient={editingPatient}
        onSave={async (patientData) => {
          if (editingPatient) {
            const { data, error } = await supabase
              .from('patients')
              .update(patientData)
              .eq('id', editingPatient.id)
              .select()
              .single();
            if (!error && data) {
              setPatients(patients.map((p) => (p.id === data.id ? data : p)));
            }
          } else {
            const { data, error } = await supabase
              .from('patients')
              .insert(patientData)
              .select()
              .single();
            if (!error && data) {
              setPatients([data, ...patients]);
            }
          }
          setShowForm(false);
          setEditingPatient(null);
        }}
        onCancel={() => {
          setShowForm(false);
          setEditingPatient(null);
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">العملاء</h1>
          <p className="text-gray-500 mt-1">
            {patients.length} عميل مسجل
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={20} />
          إضافة عميل
        </button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="ابحث عن عميل..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-field pr-10"
          />
        </div>
        <button className="btn-secondary flex items-center gap-2">
          <Filter size={18} />
          تصفية
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : filteredPatients.length === 0 ? (
        <div className="card text-center py-12">
          <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">لا يوجد عملاء</p>
          <button onClick={() => setShowForm(true)} className="btn-primary">
            إضافة عميل جديد
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPatients.map((patient) => {
            const bmi = calculateBMI(patient.weight, patient.height);
            const bmiInfo = bmi ? getBMICategory(parseFloat(bmi)) : null;

            return (
              <div key={patient.id} className="card hover:shadow-md transition-all duration-300 group">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-primary-100 to-primary-200 rounded-full flex items-center justify-center">
                      <span className="text-primary-700 font-bold text-lg">
                        {patient.name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800">{patient.name}</h3>
                      <p className="text-sm text-gray-500">
                        {patient.age ? `${patient.age} سنة` : 'العمر غير محدد'}
                        {patient.gender === 'male' ? ' - ذكر' : patient.gender === 'female' ? ' - أنثى' : ''}
                      </p>
                    </div>
                  </div>
                  <div className="relative">
                    <button
                      onClick={() => setOpenMenuId(openMenuId === patient.id ? null : patient.id)}
                      className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <MoreVertical size={18} className="text-gray-400" />
                    </button>
                    {openMenuId === patient.id && (
                      <div className="absolute left-0 top-8 bg-white rounded-lg shadow-lg border border-gray-100 py-1 min-w-[140px] z-10">
                        <button
                          onClick={() => {
                            onSelectPatient(patient.id);
                            setOpenMenuId(null);
                          }}
                          className="w-full px-4 py-2 text-right hover:bg-gray-50 flex items-center gap-2 text-sm"
                        >
                          <Eye size={16} />
                          عرض
                        </button>
                        <button
                          onClick={() => {
                            setEditingPatient(patient);
                            setShowForm(true);
                            setOpenMenuId(null);
                          }}
                          className="w-full px-4 py-2 text-right hover:bg-gray-50 flex items-center gap-2 text-sm"
                        >
                          <Edit size={16} />
                          تعديل
                        </button>
                        <button
                          onClick={() => {
                            handleDelete(patient.id);
                            setOpenMenuId(null);
                          }}
                          className="w-full px-4 py-2 text-right hover:bg-red-50 text-red-600 flex items-center gap-2 text-sm"
                        >
                          <Trash2 size={16} />
                          حذف
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  {patient.phone && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone size={14} className="text-gray-400" />
                      <span>{patient.phone}</span>
                    </div>
                  )}
                  {patient.email && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Mail size={14} className="text-gray-400" />
                      <span>{patient.email}</span>
                    </div>
                  )}
                </div>

                {bmi && bmiInfo && (
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div>
                      <span className="text-xs text-gray-500">مؤشر كتلة الجسم</span>
                      <p className="font-semibold text-gray-800">{bmi}</p>
                    </div>
                    <span className={`text-sm font-medium ${bmiInfo.color}`}>
                      {bmiInfo.label}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {openMenuId && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setOpenMenuId(null)}
        ></div>
      )}
    </div>
  );
}
