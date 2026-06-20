import { useEffect, useState } from 'react';
import {
  Users,
  ClipboardList,
  TrendingUp,
  Calendar,
  UserPlus,
  ArrowRight
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Patient, DietPlan } from '../types/database';

interface DashboardProps {
  onSelectPatient: (id: string) => void;
}

interface Stats {
  totalPatients: number;
  activeDietPlans: number;
  thisWeekPatients: number;
}

export default function Dashboard({ onSelectPatient }: DashboardProps) {
  const [stats, setStats] = useState<Stats>({
    totalPatients: 0,
    activeDietPlans: 0,
    thisWeekPatients: 0,
  });
  const [recentPatients, setRecentPatients] = useState<Patient[]>([]);
  const [recentPlans, setRecentPlans] = useState<(DietPlan & { patient: Patient })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [patientsResult, plansResult] = await Promise.all([
        supabase
          .from('patients')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(5),
        supabase
          .from('diet_plans')
          .select('*, patient:patients(*)')
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(5),
      ]);

      if (patientsResult.data) {
        setRecentPatients(patientsResult.data);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        const weeklyCount = patientsResult.data.filter(
          (p) => new Date(p.created_at) >= weekAgo
        ).length;
        setStats((prev) => ({
          ...prev,
          totalPatients: patientsResult.data.length,
          thisWeekPatients: weeklyCount,
        }));
      }

      if (plansResult.data) {
        setRecentPlans(plansResult.data as (DietPlan & { patient: Patient })[]);
        setStats((prev) => ({
          ...prev,
          activeDietPlans: plansResult.data?.length || 0,
        }));
      }
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'إجمالي العملاء',
      value: stats.totalPatients,
      icon: Users,
      color: 'from-primary-500 to-primary-600',
      bgColor: 'bg-primary-50',
    },
    {
      title: 'الأنظمة النشطة',
      value: stats.activeDietPlans,
      icon: ClipboardList,
      color: 'from-accent-500 to-accent-600',
      bgColor: 'bg-accent-50',
    },
    {
      title: 'عملاء هذا الأسبوع',
      value: stats.thisWeekPatients,
      icon: TrendingUp,
      color: 'from-emerald-500 to-emerald-600',
      bgColor: 'bg-emerald-50',
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">لوحة التحكم</h1>
          <p className="text-gray-500 mt-1">نظرة عامة على نشاطك</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Calendar size={18} />
          <span>{new Date().toLocaleDateString('ar-SA')}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              className="card hover:shadow-md transition-shadow duration-300"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">{stat.title}</p>
                  <p className="text-3xl font-bold text-gray-800">{stat.value}</p>
                </div>
                <div
                  className={`w-14 h-14 ${stat.bgColor} rounded-xl flex items-center justify-center`}
                >
                  <Icon className={`w-7 h-7 bg-gradient-to-r ${stat.color} bg-clip-text`} style={{ color: stat.color.includes('primary') ? '#2d9b8f' : stat.color.includes('accent') ? '#f97316' : '#10b981' }} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-800">أحدث العملاء</h2>
            <button className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1">
              عرض الكل
              <ArrowRight size={16} />
            </button>
          </div>
          {recentPatients.length > 0 ? (
            <div className="space-y-3">
              {recentPatients.map((patient) => (
                <button
                  key={patient.id}
                  onClick={() => onSelectPatient(patient.id)}
                  className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-primary-100 to-primary-200 rounded-full flex items-center justify-center">
                      <span className="text-primary-700 font-semibold">
                        {patient.name.charAt(0)}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-800">{patient.name}</p>
                      <p className="text-xs text-gray-500">
                        {patient.age ? `${patient.age} سنة` : 'العمر غير محدد'}
                      </p>
                    </div>
                  </div>
                  <ArrowRight size={16} className="text-gray-400" />
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <UserPlus className="w-12 h-12 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500">لا يوجد عملاء بعد</p>
            </div>
          )}
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-800">الأنظمة النشطة</h2>
            <button className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1">
              عرض الكل
              <ArrowRight size={16} />
            </button>
          </div>
          {recentPlans.length > 0 ? (
            <div className="space-y-3">
              {recentPlans.map((plan) => (
                <button
                  key={plan.id}
                  onClick={() => onSelectPatient(plan.patient_id)}
                  className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="text-right">
                    <p className="font-medium text-gray-800">{plan.name}</p>
                    <p className="text-xs text-gray-500">
                      {plan.patient?.name || 'عميل غير محدد'}
                    </p>
                  </div>
                  <div className="text-left">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                      نشط
                    </span>
                    <p className="text-xs text-gray-500 mt-1">
                      {plan.daily_calories} سعرة
                    </p>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <ClipboardList className="w-12 h-12 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500">لا توجد أنظمة غذائية نشطة</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
