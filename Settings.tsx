import { useEffect, useState } from 'react';
import { Moon, Sun, Globe, Bell, Database, LogOut, Users, Shield, Plus, Trash2, Edit } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

interface Admin {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
}

export default function Settings() {
  const { user, signOut } = useAuth();
  const [settings, setSettings] = useState({
    darkMode: false,
    notifications: true,
    language: 'ar',
  });
  const [stats, setStats] = useState({
    totalClients: 0,
    totalAdmins: 0,
    activeDietPlans: 0,
  });
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddAdmin, setShowAddAdmin] = useState(false);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [addingAdmin, setAddingAdmin] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [clientsResult, plansResult] = await Promise.all([
        supabase.from('patients').select('id', { count: 'exact', head: true }),
        supabase.from('diet_plans').select('id', { count: 'exact', head: true }).eq('status', 'active'),
      ]);

      setStats({
        totalClients: clientsResult.count || 0,
        totalAdmins: 1,
        activeDietPlans: plansResult.count || 0,
      });

      setAdmins([
        {
          id: user?.id || '',
          email: user?.email || '',
          created_at: user?.created_at || new Date().toISOString(),
          last_sign_in_at: user?.last_sign_in_at || null,
        },
      ]);
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddAdmin = async () => {
    if (!newAdminEmail || !newAdminPassword) return;

    setAddingAdmin(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: newAdminEmail,
        password: newAdminPassword,
      });

      if (error) {
        alert('حدث خطأ: ' + error.message);
      } else if (data.user) {
        setAdmins([
          ...admins,
          {
            id: data.user.id,
            email: newAdminEmail,
            created_at: data.user.created_at || new Date().toISOString(),
            last_sign_in_at: null,
          },
        ]);
        setStats({ ...stats, totalAdmins: stats.totalAdmins + 1 });
        setShowAddAdmin(false);
        setNewAdminEmail('');
        setNewAdminPassword('');
        alert('تم إضافة المسؤول بنجاح! يمكنه الآن تسجيل الدخول.');
      }
    } catch (err) {
      alert('حدث خطأ أثناء إضافة المسؤول');
    } finally {
      setAddingAdmin(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">الإعدادات</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card bg-gradient-to-br from-primary-50 to-primary-100 border border-primary-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary-500 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-primary-600">إجمالي العملاء</p>
              <p className="text-3xl font-bold text-primary-800">{stats.totalClients}</p>
            </div>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-amber-500 rounded-xl flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-amber-600">المسؤولين</p>
              <p className="text-3xl font-bold text-amber-800">{stats.totalAdmins}</p>
            </div>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-emerald-50 to-emerald-100 border border-emerald-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center">
              <Database className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-emerald-600">الأنظمة النشطة</p>
              <p className="text-3xl font-bold text-emerald-800">{stats.activeDietPlans}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">إدارة المسؤولين</h2>
          <button
            onClick={() => setShowAddAdmin(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus size={18} />
            إضافة مسؤول
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">البريد الإلكتروني</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">تاريخ الإنشاء</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">آخر تسجيل دخول</th>
                <th className="text-center py-3 px-4 text-sm font-medium text-gray-600">الحالة</th>
              </tr>
            </thead>
            <tbody>
              {admins.map((admin) => (
                <tr key={admin.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                        <span className="text-primary-700 font-medium text-sm">
                          {admin.email.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <span className="font-medium text-gray-800" dir="ltr">{admin.email}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">
                    {new Date(admin.created_at).toLocaleDateString('ar-SA')}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">
                    {admin.last_sign_in_at
                      ? new Date(admin.last_sign_in_at).toLocaleDateString('ar-SA')
                      : 'لم يسجل دخوله بعد'}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                      نشط
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showAddAdmin && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">إضافة مسؤول جديد</h3>

            <div className="space-y-4">
              <div>
                <label className="label-field">البريد الإلكتروني</label>
                <input
                  type="email"
                  value={newAdminEmail}
                  onChange={(e) => setNewAdminEmail(e.target.value)}
                  className="input-field"
                  placeholder="example@email.com"
                  dir="ltr"
                />
              </div>
              <div>
                <label className="label-field">كلمة المرور</label>
                <input
                  type="password"
                  value={newAdminPassword}
                  onChange={(e) => setNewAdminPassword(e.target.value)}
                  className="input-field"
                  placeholder="••••••••"
                  dir="ltr"
                  minLength={6}
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowAddAdmin(false);
                  setNewAdminEmail('');
                  setNewAdminPassword('');
                }}
                className="btn-secondary"
              >
                إلغاء
              </button>
              <button
                onClick={handleAddAdmin}
                disabled={addingAdmin || !newAdminEmail || !newAdminPassword}
                className="btn-primary"
              >
                {addingAdmin ? 'جاري الإضافة...' : 'إضافة'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="card">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-primary-400 to-primary-600 rounded-2xl flex items-center justify-center">
            <span className="text-white font-bold text-2xl">
              {user?.email?.charAt(0).toUpperCase() || 'U'}
            </span>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-800">حسابك</h2>
            <p className="text-gray-500" dir="ltr">{user?.email}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4">
        <div className="card">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                <Globe className="text-primary-600" size={20} />
              </div>
              <div>
                <h3 className="font-medium text-gray-800">اللغة</h3>
                <p className="text-sm text-gray-500">اختر لغة الواجهة</p>
              </div>
            </div>
            <select
              value={settings.language}
              onChange={(e) => setSettings({ ...settings, language: e.target.value })}
              className="input-field w-32"
            >
              <option value="ar">العربية</option>
              <option value="en">English</option>
            </select>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                {settings.darkMode ? (
                  <Moon className="text-amber-600" size={20} />
                ) : (
                  <Sun className="text-amber-600" size={20} />
                )}
              </div>
              <div>
                <h3 className="font-medium text-gray-800">الوضع الليلي</h3>
                <p className="text-sm text-gray-500">تفعيل الوضع الداكن</p>
              </div>
            </div>
            <button
              onClick={() => setSettings({ ...settings, darkMode: !settings.darkMode })}
              className={`w-12 h-6 rounded-full transition-colors ${
                settings.darkMode ? 'bg-primary-600' : 'bg-gray-300'
              }`}
            >
              <div
                className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${
                  settings.darkMode ? '-translate-x-6' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Bell className="text-blue-600" size={20} />
              </div>
              <div>
                <h3 className="font-medium text-gray-800">الإشعارات</h3>
                <p className="text-sm text-gray-500">تفعيل إشعارات النظام</p>
              </div>
            </div>
            <button
              onClick={() => setSettings({ ...settings, notifications: !settings.notifications })}
              className={`w-12 h-6 rounded-full transition-colors ${
                settings.notifications ? 'bg-primary-600' : 'bg-gray-300'
              }`}
            >
              <div
                className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${
                  settings.notifications ? '-translate-x-6' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                <Database className="text-emerald-600" size={20} />
              </div>
              <div>
                <h3 className="font-medium text-gray-800">قاعدة البيانات</h3>
                <p className="text-sm text-gray-500">النسخ الاحتياطي والاستعادة</p>
              </div>
            </div>
            <button className="btn-secondary">
              تصدير البيانات
            </button>
          </div>
        </div>
      </div>

      <div className="card bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <LogOut className="text-red-600" size={20} />
            </div>
            <div>
              <h3 className="font-medium text-gray-800">تسجيل الخروج</h3>
              <p className="text-sm text-gray-500">الخروج من حسابك</p>
            </div>
          </div>
          <button onClick={signOut} className="bg-red-50 hover:bg-red-100 text-red-600 font-medium py-2 px-4 rounded-lg transition-all">
            تسجيل الخروج
          </button>
        </div>
      </div>

      <div className="card bg-gradient-to-br from-primary-50 to-primary-100 border border-primary-200">
        <div className="text-center py-4">
          <h3 className="text-lg font-bold text-primary-800 mb-1">fuelx</h3>
          <p className="text-primary-600 text-sm mb-2">نظام إدارة التغذية المتكامل</p>
          <p className="text-xs text-primary-400">الإصدار 1.0.0</p>
        </div>
      </div>
    </div>
  );
}
