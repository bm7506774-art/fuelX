import { useState } from 'react';
import { X } from 'lucide-react';
import type { Patient, PatientInsert } from '../types/database';

interface PatientFormProps {
  patient: Patient | null;
  onSave: (data: PatientInsert) => Promise<void>;
  onCancel: () => void;
}

export default function PatientForm({ patient, onSave, onCancel }: PatientFormProps) {
  const [formData, setFormData] = useState<PatientInsert>({
    name: patient?.name || '',
    phone: patient?.phone || '',
    email: patient?.email || '',
    age: patient?.age || null,
    gender: patient?.gender || null,
    weight: patient?.weight || null,
    height: patient?.height || null,
    health_conditions: patient?.health_conditions || [],
    allergies: patient?.allergies || [],
  });
  const [healthConditionInput, setHealthConditionInput] = useState('');
  const [allergyInput, setAllergyInput] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave(formData);
    } finally {
      setSaving(false);
    }
  };

  const addHealthCondition = () => {
    if (healthConditionInput.trim()) {
      setFormData({
        ...formData,
        health_conditions: [...formData.health_conditions, healthConditionInput.trim()],
      });
      setHealthConditionInput('');
    }
  };

  const removeHealthCondition = (index: number) => {
    setFormData({
      ...formData,
      health_conditions: formData.health_conditions.filter((_, i) => i !== index),
    });
  };

  const addAllergy = () => {
    if (allergyInput.trim()) {
      setFormData({
        ...formData,
        allergies: [...formData.allergies, allergyInput.trim()],
      });
      setAllergyInput('');
    }
  };

  const removeAllergy = (index: number) => {
    setFormData({
      ...formData,
      allergies: formData.allergies.filter((_, i) => i !== index),
    });
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-800">
            {patient ? 'تعديل بيانات العميل' : 'إضافة عميل جديد'}
          </h2>
          <button onClick={onCancel} className="p-2 hover:bg-gray-100 rounded-lg">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label-field">الاسم الكامل *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="input-field"
                placeholder="أدخل اسم المريض"
              />
            </div>
            <div>
              <label className="label-field">رقم الهاتف</label>
              <input
                type="tel"
                value={formData.phone || ''}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="input-field"
                placeholder="05xxxxxxxx"
                dir="ltr"
              />
            </div>
            <div>
              <label className="label-field">البريد الإلكتروني</label>
              <input
                type="email"
                value={formData.email || ''}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="input-field"
                placeholder="example@email.com"
                dir="ltr"
              />
            </div>
            <div>
              <label className="label-field">العمر</label>
              <input
                type="number"
                min="1"
                max="120"
                value={formData.age || ''}
                onChange={(e) => setFormData({ ...formData, age: e.target.value ? parseInt(e.target.value) : null })}
                className="input-field"
                placeholder="سنة"
              />
            </div>
            <div>
              <label className="label-field">الجنس</label>
              <select
                value={formData.gender || ''}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value as 'male' | 'female' | null || null })}
                className="input-field"
              >
                <option value="">اختر...</option>
                <option value="male">ذكر</option>
                <option value="female">أنثى</option>
              </select>
            </div>
            <div>
              <label className="label-field">الوزن (كجم)</label>
              <input
                type="number"
                step="0.1"
                min="1"
                value={formData.weight || ''}
                onChange={(e) => setFormData({ ...formData, weight: e.target.value ? parseFloat(e.target.value) : null })}
                className="input-field"
                placeholder="كجم"
              />
            </div>
            <div>
              <label className="label-field">الطول (سم)</label>
              <input
                type="number"
                min="50"
                max="250"
                value={formData.height || ''}
                onChange={(e) => setFormData({ ...formData, height: e.target.value ? parseFloat(e.target.value) : null })}
                className="input-field"
                placeholder="سم"
              />
            </div>
          </div>

          <div>
            <label className="label-field">الحالات الصحية</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={healthConditionInput}
                onChange={(e) => setHealthConditionInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addHealthCondition())}
                className="input-field flex-1"
                placeholder="أضف حالة صحية..."
              />
              <button type="button" onClick={addHealthCondition} className="btn-secondary">
                إضافة
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.health_conditions.map((condition, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                >
                  {condition}
                  <button type="button" onClick={() => removeHealthCondition(index)}>
                    <X size={14} />
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div>
            <label className="label-field">الحساسية</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={allergyInput}
                onChange={(e) => setAllergyInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addAllergy())}
                className="input-field flex-1"
                placeholder="أضف نوع الحساسية..."
              />
              <button type="button" onClick={addAllergy} className="btn-secondary">
                إضافة
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.allergies.map((allergy, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm"
                >
                  {allergy}
                  <button type="button" onClick={() => removeAllergy(index)}>
                    <X size={14} />
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
            <button type="button" onClick={onCancel} className="btn-secondary">
              إلغاء
            </button>
            <button type="submit" disabled={saving} className="btn-primary min-w-[100px]">
              {saving ? 'جاري الحفظ...' : 'حفظ'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
