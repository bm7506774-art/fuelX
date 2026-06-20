import { useEffect, useState } from 'react';
import {
  ArrowRight,
  Plus,
  Save,
  Calendar,
  Target,
  User,
  ChevronDown,
  Trash2,
  Edit2,
  Copy
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Patient, DietPlan, Meal, FoodItem, DietPlanInsert, MealInsert, FoodItemInsert } from '../types/database';

interface DietPlanBuilderProps {
  dietPlanId?: string | null;
  preselectedPatientId?: string | null;
  onBack: () => void;
  onNewPlan?: () => void;
}

const DAYS_AR = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

const MEAL_TYPES = [
  { id: 'breakfast', label: 'الفطور', color: 'bg-amber-100 text-amber-700' },
  { id: 'snack_morning', label: 'وجبة خفيفة صباحية', color: 'bg-emerald-100 text-emerald-700' },
  { id: 'lunch', label: 'الغداء', color: 'bg-blue-100 text-blue-700' },
  { id: 'snack_afternoon', label: 'وجبة خفيفة مسائية', color: 'bg-purple-100 text-purple-700' },
  { id: 'dinner', label: 'العشاء', color: 'bg-rose-100 text-rose-700' },
  { id: 'snack_evening', label: 'وجبة خفيفة ليلية', color: 'bg-indigo-100 text-indigo-700' },
];

const COMMON_FOODS = [
  { name: 'خبز أبيض', unit: 'شريحة', calories: 80, protein: 2.5, carbs: 15, fats: 1 },
  { name: 'خبز بر', unit: 'شريحة', calories: 70, protein: 3, carbs: 14, fats: 0.5 },
  { name: 'أرز مطبوخ', unit: 'كوب', calories: 200, protein: 4, carbs: 45, fats: 0.5 },
  { name: 'صدر دجاج مشوي', unit: '100 جم', calories: 165, protein: 31, carbs: 0, fats: 3.6 },
  { name: 'لحم بقري مطبوخ', unit: '100 جم', calories: 250, protein: 26, carbs: 0, fats: 15 },
  { name: 'سمك مشوي', unit: '100 جم', calories: 140, protein: 25, carbs: 0, fats: 3 },
  { name: 'بيض مسلوق', unit: 'حبة', calories: 70, protein: 6, carbs: 0.5, fats: 5 },
  { name: 'جبن أبيض', unit: '30 جم', calories: 80, protein: 5, carbs: 1, fats: 6 },
  { name: 'لبن زبادي', unit: 'كوب', calories: 150, protein: 8, carbs: 12, fats: 8 },
  { name: 'حليب كامل', unit: 'كوب', calories: 150, protein: 8, carbs: 12, fats: 8 },
  { name: 'تفاح', unit: 'حبة متوسطة', calories: 95, protein: 0.5, carbs: 25, fats: 0 },
  { name: 'موز', unit: 'حبة متوسطة', calories: 105, protein: 1.3, carbs: 27, fats: 0.4 },
  { name: 'برتقال', unit: 'حبة متوسطة', calories: 65, protein: 1, carbs: 16, fats: 0 },
  { name: 'خيار', unit: 'حبة متوسطة', calories: 15, protein: 0.5, carbs: 3, fats: 0 },
  { name: 'طماطم', unit: 'حبة متوسطة', calories: 20, protein: 1, carbs: 4, fats: 0 },
  { name: 'سلطة خضراء', unit: 'طبق صغير', calories: 30, protein: 1, carbs: 6, fats: 0 },
  { name: 'شوربة عدس', unit: 'كوب', calories: 180, protein: 12, carbs: 30, fats: 1 },
  { name: 'فول مدمس', unit: 'كوب', calories: 200, protein: 10, carbs: 30, fats: 3 },
  { name: 'حمص', unit: 'كوب', calories: 180, protein: 8, carbs: 25, fats: 5 },
  { name: 'شوفان', unit: 'كوب مطبوخ', calories: 150, protein: 6, carbs: 27, fats: 2.5 },
  { name: 'لوز', unit: '30 جم', calories: 170, protein: 6, carbs: 6, fats: 14 },
  { name: 'عسل', unit: 'ملعقة كبيرة', calories: 64, protein: 0, carbs: 17, fats: 0 },
  { name: 'تمر', unit: 'حبة', calories: 20, protein: 0.2, carbs: 5, fats: 0 },
];

export default function DietPlanBuilder({ dietPlanId, preselectedPatientId, onBack, onNewPlan }: DietPlanBuilderProps) {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [step, setStep] = useState<'info' | 'meals'>('info');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);

  const [planData, setPlanData] = useState<DietPlanInsert>({
    patient_id: preselectedPatientId || '',
    name: '',
    description: '',
    start_date: null,
    end_date: null,
    daily_calories: 2000,
    protein_grams: null,
    carbs_grams: null,
    fats_grams: null,
    status: 'active',
  });

  const [meals, setMeals] = useState<MealInsert[]>([]);
  const [selectedDay, setSelectedDay] = useState(0);
  const [showFoodModal, setShowFoodModal] = useState(false);
  const [selectedMealForFood, setSelectedMealForFood] = useState<{ day: number; type: string } | null>(null);
  const [foodSearchQuery, setFoodSearchQuery] = useState('');
  const [customFood, setCustomFood] = useState({
    name: '',
    quantity: 1,
    unit: '',
    calories: 0,
    protein: 0,
    carbs: 0,
    fats: 0,
  });

  useEffect(() => {
    loadPatients();
    if (dietPlanId && dietPlanId !== 'new') {
      loadDietPlan(dietPlanId);
    }
    if (preselectedPatientId) {
      setPlanData(prev => ({ ...prev, patient_id: preselectedPatientId }));
    }
  }, [dietPlanId, preselectedPatientId]);

  const loadPatients = async () => {
    const { data } = await supabase.from('patients').select('*').order('name');
    if (data) setPatients(data);
  };

  const loadDietPlan = async (id: string) => {
    setLoading(true);
    try {
      const { data: plan } = await supabase.from('diet_plans').select('*').eq('id', id).single();
      if (plan) {
        setPlanData({
          patient_id: plan.patient_id,
          name: plan.name,
          description: plan.description,
          start_date: plan.start_date,
          end_date: plan.end_date,
          daily_calories: plan.daily_calories,
          protein_grams: plan.protein_grams,
          carbs_grams: plan.carbs_grams,
          fats_grams: plan.fats_grams,
          status: plan.status,
        });

        const { data: existingMeals } = await supabase.from('meals').select('*').eq('diet_plan_id', id);
        if (existingMeals) {
          setMeals(existingMeals.map(m => ({
            diet_plan_id: id,
            day_of_week: m.day_of_week,
            meal_type: m.meal_type,
            name: m.name,
            description: m.description,
            calories: m.calories,
            protein: m.protein,
            carbs: m.carbs,
            fats: m.fats,
          })));
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSavePlan = async () => {
    if (!planData.patient_id || !planData.name) {
      alert('الرجاء تحديد المريض واسم النظام');
      return;
    }

    setSaving(true);
    try {
      let planId = dietPlanId;

      if (dietPlanId === 'new' || !dietPlanId) {
        const { data: newPlan } = await supabase
          .from('diet_plans')
          .insert({ ...planData, patient_id: planData.patient_id! })
          .select()
          .single();
        if (newPlan) planId = newPlan.id;
      } else {
        await supabase.from('diet_plans').update(planData).eq('id', dietPlanId);
      }

      if (planId) {
        await supabase.from('meals').delete().eq('diet_plan_id', planId);

        const mealsToInsert = meals.map(m => ({ ...m, diet_plan_id: planId }));
        if (mealsToInsert.length > 0) {
          await supabase.from('meals').insert(mealsToInsert);
        }
      }

      onBack();
    } catch (error) {
      console.error('Error saving plan:', error);
      alert('حدث خطأ أثناء الحفظ');
    } finally {
      setSaving(false);
    }
  };

  const addMeal = (dayOfWeek: number, mealType: string) => {
    const mealNameAr = MEAL_TYPES.find(m => m.id === mealType)?.label || mealType;
    const dayNameAr = DAYS_AR[dayOfWeek];

    setMeals([
      ...meals,
      {
        diet_plan_id: dietPlanId || 'temp',
        day_of_week: dayOfWeek,
        meal_type: mealType as MealInsert['meal_type'],
        name: `${mealNameAr} - ${dayNameAr}`,
        description: '',
        calories: 0,
        protein: 0,
        carbs: 0,
        fats: 0,
      },
    ]);
  };

  const updateMeal = (index: number, updates: Partial<MealInsert>) => {
    const updated = [...meals];
    updated[index] = { ...updated[index], ...updates };
    setMeals(updated);
  };

  const removeMeal = (index: number) => {
    setMeals(meals.filter((_, i) => i !== index));
  };

  const getMealsForDayAndType = (day: number, type: string) => {
    return meals.filter(m => m.day_of_week === day && m.meal_type === type);
  };

  const getDayTotal = (day: number) => {
    return meals
      .filter(m => m.day_of_week === day)
      .reduce((sum, m) => sum + (m.calories || 0), 0);
  };

  const filteredFoods = COMMON_FOODS.filter(f =>
    f.name.includes(foodSearchQuery)
  );

  const addFoodToMeal = (food: typeof COMMON_FOODS[0]) => {
    if (!selectedMealForFood) return;

    const { day, type } = selectedMealForFood;
    const existingMeals = getMealsForDayAndType(day, type);

    if (existingMeals.length > 0) {
      const mealIndex = meals.findIndex(m => m.day_of_week === day && m.meal_type === type);
      if (mealIndex !== -1) {
        const meal = meals[mealIndex];
        updateMeal(mealIndex, {
          calories: (meal.calories || 0) + food.calories,
          protein: (meal.protein || 0) + food.protein,
          carbs: (meal.carbs || 0) + food.carbs,
          fats: (meal.fats || 0) + food.fats,
          description: meal.description ? `${meal.description}\n${food.name}` : food.name,
        });
      }
    } else {
      const mealNameAr = MEAL_TYPES.find(m => m.id === type)?.label || type;
      addMeal(day, type);
      setTimeout(() => {
        const newIndex = meals.length;
        updateMeal(newIndex, {
          calories: food.calories,
          protein: food.protein,
          carbs: food.carbs,
          fats: food.fats,
          description: food.name,
        });
      }, 50);
    }

    setShowFoodModal(false);
    setSelectedMealForFood(null);
  };

  const calculateMacros = () => {
    const totals = meals.reduce(
      (acc, m) => ({
        protein: acc.protein + (m.protein || 0),
        carbs: acc.carbs + (m.carbs || 0),
        fats: acc.fats + (m.fats || 0),
        calories: acc.calories + (m.calories || 0),
      }),
      { protein: 0, carbs: 0, fats: 0, calories: 0 }
    );

    const avgDaily = {
      calories: Math.round(totals.calories / 7),
      protein: Math.round(totals.protein / 7),
      carbs: Math.round(totals.carbs / 7),
      fats: Math.round(totals.fats / 7),
    };

    return { totals, avgDaily };
  };

  const copyDay = (fromDay: number, toDay: number) => {
    const dayMeals = meals.filter(m => m.day_of_week === fromDay);
    const newMeals = dayMeals.map(m => ({ ...m, day_of_week: toDay }));
    setMeals([...meals.filter(m => m.day_of_week !== toDay), ...newMeals]);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const { avgDaily } = calculateMacros();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="flex items-center gap-2 text-gray-600 hover:text-gray-800">
          <ArrowRight size={20} />
          <span>العودة</span>
        </button>

        <div className="flex items-center gap-3">
          {step === 'meals' && (
            <button onClick={() => setStep('info')} className="btn-secondary">
              معلومات النظام
            </button>
          )}
          <button onClick={handleSavePlan} disabled={saving} className="btn-primary flex items-center gap-2">
            <Save size={18} />
            {saving ? 'جاري الحفظ...' : 'حفظ النظام'}
          </button>
        </div>
      </div>

      {step === 'info' && (
        <div className="card">
          <h2 className="text-xl font-bold text-gray-800 mb-6">معلومات النظام الغذائي</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="label-field">اسم النظام *</label>
              <input
                type="text"
                value={planData.name}
                onChange={(e) => setPlanData({ ...planData, name: e.target.value })}
                className="input-field"
                placeholder="مثال: نظام إنقاص الوزن"
              />
            </div>

            <div>
              <label className="label-field">العميل *</label>
              <select
                value={planData.patient_id}
                onChange={(e) => setPlanData({ ...planData, patient_id: e.target.value })}
                className="input-field"
              >
                <option value="">اختر العميل</option>
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label-field">تاريخ البداية</label>
              <input
                type="date"
                value={planData.start_date || ''}
                onChange={(e) => setPlanData({ ...planData, start_date: e.target.value || null })}
                className="input-field"
              />
            </div>

            <div>
              <label className="label-field">تاريخ النهاية</label>
              <input
                type="date"
                value={planData.end_date || ''}
                onChange={(e) => setPlanData({ ...planData, end_date: e.target.value || null })}
                className="input-field"
              />
            </div>

            <div className="md:col-span-2">
              <label className="label-field">وصف النظام</label>
              <textarea
                value={planData.description || ''}
                onChange={(e) => setPlanData({ ...planData, description: e.target.value })}
                className="input-field min-h-[100px]"
                placeholder="وصف مختصر للنظام الغذائي..."
              />
            </div>

            <div>
              <label className="label-field">السعرات اليومية المستهدفة</label>
              <input
                type="number"
                value={planData.daily_calories || ''}
                onChange={(e) => setPlanData({ ...planData, daily_calories: e.target.value ? parseInt(e.target.value) : null })}
                className="input-field"
              />
            </div>

            <div className="flex items-center gap-4">
              <div className="flex-1">
                <label className="label-field">البروتين (جم)</label>
                <input
                  type="number"
                  value={planData.protein_grams || ''}
                  onChange={(e) => setPlanData({ ...planData, protein_grams: e.target.value ? parseInt(e.target.value) : null })}
                  className="input-field"
                />
              </div>
              <div className="flex-1">
                <label className="label-field">الكربوهيدرات (جم)</label>
                <input
                  type="number"
                  value={planData.carbs_grams || ''}
                  onChange={(e) => setPlanData({ ...planData, carbs_grams: e.target.value ? parseInt(e.target.value) : null })}
                  className="input-field"
                />
              </div>
              <div className="flex-1">
                <label className="label-field">الدهون (جم)</label>
                <input
                  type="number"
                  value={planData.fats_grams || ''}
                  onChange={(e) => setPlanData({ ...planData, fats_grams: e.target.value ? parseInt(e.target.value) : null })}
                  className="input-field"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end mt-6 pt-6 border-t border-gray-100">
            <button
              onClick={() => setStep('meals')}
              className="btn-accent flex items-center gap-2"
            >
              التالي: تحديد الوجبات
              <ChevronDown size={18} className="rotate-[-90deg]" />
            </button>
          </div>
        </div>
      )}

      {step === 'meals' && (
        <div className="space-y-6">
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-800">ملخص السعرات</h3>
              <div className="flex items-center gap-4 text-sm">
                <span className="text-gray-500">المتوسط اليومي:</span>
                <span className="font-bold text-primary-600">{avgDaily.calories} سعرة</span>
                <span className="text-gray-400">|</span>
                <span className="text-amber-600">{avgDaily.protein}جم بروتين</span>
                <span className="text-blue-600">{avgDaily.carbs}جم كربوهيدرات</span>
                <span className="text-rose-600">{avgDaily.fats}جم دهون</span>
              </div>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-l from-primary-400 to-primary-600 transition-all duration-300"
                style={{ width: `${Math.min((avgDaily.calories / (planData.daily_calories || 2000)) * 100, 100)}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {Math.round((avgDaily.calories / (planData.daily_calories || 2000)) * 100)}% من السعرات المستهدفة
            </p>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2">
            {DAYS_AR.map((day, index) => (
              <button
                key={index}
                onClick={() => setSelectedDay(index)}
                className={`px-4 py-2 rounded-lg whitespace-nowrap transition-all ${
                  selectedDay === index
                    ? 'bg-primary-600 text-white shadow-md'
                    : 'bg-white border border-gray-200 text-gray-600 hover:border-primary-300'
                }`}
              >
                <div className="text-sm font-medium">{day}</div>
                <div className="text-xs opacity-75">{getDayTotal(index)} سعرة</div>
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {MEAL_TYPES.map((mealType) => {
              const dayMeals = getMealsForDayAndType(selectedDay, mealType.id);
              const totalCalories = dayMeals.reduce((sum, m) => sum + (m.calories || 0), 0);

              return (
                <div key={mealType.id} className="card">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${mealType.color}`}>
                        {mealType.label}
                      </span>
                      <span className="text-sm text-gray-500">{totalCalories} سعرة</span>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedMealForFood({ day: selectedDay, type: mealType.id });
                        setShowFoodModal(true);
                      }}
                      className="p-1.5 hover:bg-gray-100 rounded-lg"
                    >
                      <Plus size={16} className="text-gray-500" />
                    </button>
                  </div>

                  {dayMeals.length === 0 ? (
                    <button
                      onClick={() => {
                        addMeal(selectedDay, mealType.id);
                      }}
                      className="w-full py-4 border-2 border-dashed border-gray-200 rounded-lg text-gray-400 hover:border-primary-300 hover:text-primary-500 transition-colors text-sm"
                    >
                      أضف {mealType.label}
                    </button>
                  ) : (
                    <div className="space-y-2">
                      {dayMeals.map((meal, idx) => {
                        const mealIndex = meals.findIndex(
                          m => m.day_of_week === meal.day_of_week && m.meal_type === meal.meal_type
                        ) + idx;

                        return (
                          <div
                            key={`${selectedDay}-${mealType.id}-${idx}`}
                            className="p-3 bg-gray-50 rounded-lg"
                          >
                            <input
                              type="text"
                              value={meal.description || ''}
                              onChange={(e) => {
                                if (mealIndex >= 0) {
                                  const actualIndex = meals.findIndex(
                                    m => m.day_of_week === selectedDay && m.meal_type === mealType.id
                                  );
                                  updateMeal(actualIndex + idx, { description: e.target.value });
                                }
                              }}
                              className="w-full bg-transparent border-none text-sm text-gray-700 focus:outline-none"
                              placeholder="وصف الوجبة..."
                            />
                            <div className="flex items-center justify-between mt-2">
                              <div className="flex items-center gap-2">
                                <input
                                  type="number"
                                  value={meal.calories || 0}
                                  onChange={(e) => {
                                    const actualIndex = meals.findIndex(
                                      m => m.day_of_week === selectedDay && m.meal_type === mealType.id
                                    );
                                    updateMeal(actualIndex + idx, { calories: parseInt(e.target.value) || 0 });
                                  }}
                                  className="w-16 text-xs bg-white border border-gray-200 rounded px-2 py-1"
                                />
                                <span className="text-xs text-gray-400">سعرة</span>
                              </div>
                              <button
                                onClick={() => {
                                  const actualIndex = meals.findIndex(
                                    m => m.day_of_week === selectedDay && m.meal_type === mealType.id
                                  );
                                  removeMeal(actualIndex + idx);
                                }}
                                className="p-1 hover:bg-red-50 rounded text-red-500"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="card">
            <h3 className="font-medium text-gray-800 mb-3">نسخ يوم إلى يوم آخر</h3>
            <div className="flex items-center gap-3">
              <select
                className="input-field w-auto"
                onChange={(e) => {
                  if (e.target.value) {
                    copyDay(selectedDay, parseInt(e.target.value));
                    e.target.value = '';
                  }
                }}
              >
                <option value="">نسخ إلى...</option>
                {DAYS_AR.filter((_, i) => i !== selectedDay).map((day, i) => (
                  <option key={i} value={i < selectedDay ? i : i + 1}>
                    {day}
                  </option>
                ))}
              </select>
              <span className="text-sm text-gray-500">
                نسخ وجبات {DAYS_AR[selectedDay]}
              </span>
            </div>
          </div>
        </div>
      )}

      {showFoodModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-800">إضافة طعام</h3>
                <button
                  onClick={() => {
                    setShowFoodModal(false);
                    setSelectedMealForFood(null);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <ArrowRight size={20} />
                </button>
              </div>
              <input
                type="text"
                value={foodSearchQuery}
                onChange={(e) => setFoodSearchQuery(e.target.value)}
                className="input-field"
                placeholder="ابحث عن طعام..."
                autoFocus
              />
            </div>

            <div className="p-6 overflow-y-auto max-h-[50vh]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredFoods.map((food, index) => (
                  <button
                    key={index}
                    onClick={() => addFoodToMeal(food)}
                    className="p-4 text-right bg-gray-50 hover:bg-primary-50 rounded-xl transition-colors group"
                  >
                    <div className="font-medium text-gray-800 group-hover:text-primary-700">
                      {food.name}
                    </div>
                    <div className="text-sm text-gray-500 flex items-center gap-3 mt-1">
                      <span>{food.unit}</span>
                      <span>{food.calories} سعرة</span>
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      ب: {food.protein}جم | ك: {food.carbs}جم | د: {food.fats}جم
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="p-6 border-t border-gray-100">
              <h4 className="font-medium text-gray-700 mb-3">أو أضف طعام مخصص</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <input
                  type="text"
                  value={customFood.name}
                  onChange={(e) => setCustomFood({ ...customFood, name: e.target.value })}
                  className="input-field text-sm"
                  placeholder="اسم الطعام"
                />
                <input
                  type="text"
                  value={customFood.unit}
                  onChange={(e) => setCustomFood({ ...customFood, unit: e.target.value })}
                  className="input-field text-sm"
                  placeholder="الوحدة"
                />
                <input
                  type="number"
                  value={customFood.calories}
                  onChange={(e) => setCustomFood({ ...customFood, calories: parseInt(e.target.value) || 0 })}
                  className="input-field text-sm"
                  placeholder="سعرة"
                />
                <button
                  onClick={() => {
                    if (customFood.name && customFood.calories) {
                      addFoodToMeal({
                        name: customFood.name,
                        unit: customFood.unit || 'حصة',
                        calories: customFood.calories,
                        protein: customFood.protein,
                        carbs: customFood.carbs,
                        fats: customFood.fats,
                      });
                      setCustomFood({ name: '', quantity: 1, unit: '', calories: 0, protein: 0, carbs: 0, fats: 0 });
                    }
                  }}
                  className="btn-primary text-sm"
                >
                  إضافة
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
