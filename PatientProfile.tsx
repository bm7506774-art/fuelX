import { useEffect, useState } from 'react';
import {
  ArrowRight,
  Edit,
  Plus,
  User,
  Phone,
  Mail,
  Calendar,
  Weight,
  Ruler,
  Heart,
  AlertTriangle,
  ClipboardList
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Patient, DietPlan } from '../types/database';
import PatientForm from './PatientForm';

interface PatientProfileProps {
  patientId: string;
  onBack: () => void;
  onCreateDietPlan: () => void;
}

export default function PatientProfile({ patientId, onBack, onCreateDietPlan }: PatientProfileProps) {
  const [patient, setPatient] = useState<Patient | null>(null);
  const [dietPlans, setDietPlans] = useState<DietPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditForm, setShowEditForm] = useState(false);

  useEffect(() => {
    loadPatientData();
  }, [patientId]);

  const loadPatientData = async () => {
    try {
      const [patientResult, plansResult] = await Promise.all([
        supabase.from('patients').select('*').eq('id', patientId).single(),
        supabase
          .from('diet_plans')
          .select('*')
          .eq('patient_id', patientId)
          .order('created_at', { ascending: false }),
      ]);

      if (patientResult.data) setPatient(patientResult.data);
      if (plansResult.data) setDietPlans(plansResult.data);
    } catch (error) {
      console.error('Error loading patient:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateBMI = (weight: number | null, height: number | null) => {
    if (!weight || !height) return null;
    return weight / ((height / 100) ** 2);
  };

  const getBMIInfo = (bmi: number) => {
    if (bmi < 18.5) return { label: 'نقص وزن', color: 'bg-blue-100 text-blue-700', range: '< 18.5' };
    if (bmi < 25) return { label: 'وزن طبيعي', color: 'bg-emerald-100 text-emerald-700', range: '18.5 - 24.9' };
    if (bmi < 30) return { label: 'زيادة وزن', color: 'bg-amber-100 text-amber-700', range: '25 - 29.9' };
    return { label: 'سمنة', color: 'bg-red-100 text-red-700', range: '>= 30' };
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      active: 'bg-emerald-100 text-emerald-700',
      paused: 'bg-amber-100 text-amber-700',
      completed: 'bg-gray-100 text-gray-700',
    };
    const labels = {
      active: 'نشط',
      paused: 'متوقف',
      completed: 'مكتمل',
    };
    return (
      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${styles[status as keyof typeof styles]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="card text-center py-12">
        <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500">العميل غير موجود</p>
        <button onClick={onBack} className="btn-primary mt-4">
          العودة
        </button>
      </div>
    );
  }

  if (showEditForm) {
    return (
      <PatientForm
        patient={patient}
        onSave={async (data) => {
          const { data: updated } = await supabase
            .from('patients')
            .update(data)
            .eq('id', patientId)
            .select()
            .single();
          if (updated) setPatient(updated);
          setShowEditForm(false);
        }}
        onCancel={() => setShowEditForm(false)}
      />
    );
  }

  const bmi = calculateBMI(patient.weight, patient.height);
  const bmiInfo = bmi ? getBMIInfo(bmi) : null;

  return (
    <div className="space-y-6">
      <button onClick={onBack} className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors">
        <ArrowRight size={20} />
        <span>العودة للقائمة</span>
      </button>

      <div className="card">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-primary-400 to-primary-600 rounded-2xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-2xl">{patient.name.charAt(0)}</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">{patient.name}</h1>
              <p className="text-gray-500">
                {patient.age ? `${patient.age} سنة` : 'العمر غير محدد'}
                {patient.gender === 'male' ? ' - ذكر' : patient.gender === 'female' ? ' - أنثى' : ''}
              </p>
            </div>
          </div>
          <button onClick={() => setShowEditForm(true)} className="btn-secondary flex items-center gap-2">
            <Edit size={18} />
            تعديل البيانات
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {patient.phone && (
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Phone className="text-gray-400" size={18} />
              <div>
                <p className="text-xs text-gray-500">الهاتف</p>
                <p className="font-medium text-gray-800" dir="ltr">{patient.phone}</p>
              </div>
            </div>
          )}
          {patient.email && (
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Mail className="text-gray-400" size={18} />
              <div>
                <p className="text-xs text-gray-500">البريد الإلكتروني</p>
                <p className="font-medium text-gray-800" dir="ltr">{patient.email}</p>
              </div>
            </div>
          )}
          {patient.weight && (
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Weight className="text-gray-400" size={18} />
              <div>
                <p className="text-xs text-gray-500">الوزن</p>
                <p className="font-medium text-gray-800">{patient.weight} كجم</p>
              </div>
            </div>
          )}
          {patient.height && (
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Ruler className="text-gray-400" size={18} />
              <div>
                <p className="text-xs text-gray-500">الطول</p>
                <p className="font-medium text-gray-800">{patient.height} سم</p>
              </div>
            </div>
          )}
        </div>

        {(patient.health_conditions.length > 0 || patient.allergies.length > 0) && (
          <div className="mt-6 pt-6 border-t border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-6">
            {patient.health_conditions.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Heart size={18} className="text-red-500" />
                  <h3 className="font-medium text-gray-800">الحالات الصحية</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {patient.health_conditions.map((condition, i) => (
                    <span key={i} className="px-3 py-1 bg-red-50 text-red-700 rounded-full text-sm">
                      {condition}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {patient.allergies.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle size={18} className="text-amber-500" />
                  <h3 className="font-medium text-gray-800">الحساسية</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {patient.allergies.map((allergy, i) => (
                    <span key={i} className="px-3 py-1 bg-amber-50 text-amber-700 rounded-full text-sm">
                      {allergy}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {bmi && bmiInfo && (
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">مؤشر كتلة الجسم</h2>
          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className="text-4xl font-bold text-gray-800">{bmi.toFixed(1)}</div>
              <div className={`mt-2 px-3 py-1 rounded-full text-sm font-medium ${bmiInfo.color}`}>
                {bmiInfo.label}
              </div>
            </div>
            <div className="flex-1">
              <div className="h-3 rounded-full bg-gray-100 overflow-hidden">
                <div className="h-full flex">
                  <div className="w-[18.5%] bg-blue-400"></div>
                  <div className="w-[6.5%] bg-emerald-400"></div>
                  <div className="w-[5%] bg-amber-400"></div>
                  <div className="w-[70%] bg-red-400"></div>
                </div>
              </div>
              <div className="flex justify-between mt-2 text-xs text-gray-500">
                <span>نقص الوزن</span>
                <span>طبيعي</span>
                <span>زيادة</span>
                <span>سمنة</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-800">الأنظمة الغذائية</h2>
          <button onClick={onCreateDietPlan} className="btn-primary flex items-center gap-2">
            <Plus size={18} />
            نظام غذائي جديد
          </button>
        </div>

        {dietPlans.length === 0 ? (
          <div className="text-center py-8">
            <ClipboardList className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 mb-4">لا توجد أنظمة غذائية لهذا العميل</p>
            <button onClick={onCreateDietPlan} className="btn-primary">
              إنشاء نظام غذائي
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {dietPlans.map((plan) => (
              <div
                key={plan.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div>
                  <h3 className="font-medium text-gray-800">{plan.name}</h3>
                  <p className="text-sm text-gray-500">
                    {plan.daily_calories ? `${plan.daily_calories} سعرة يومياً` : 'السعرات غير محددة'}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {getStatusBadge(plan.status)}
                  <button className="p-2 hover:bg-gray-200 rounded-lg transition-colors">
                    <ArrowRight size={18} className="text-gray-400" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
