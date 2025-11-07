import React, { useState, useEffect } from 'react';
import { AlertCircle, Users, User, Home, Clock, MapPin, Save, RefreshCw } from 'lucide-react';

const DisasterManagementApp = () => {
  const [view, setView] = useState('select');
  const [staffId, setStaffId] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [staffData, setStaffData] = useState({
    name: '',
    department: '',
    status: '',
    location: '',
    canReport: '',
    reportTime: '',
    comment: '',
    timestamp: ''
  });
  const [allStaff, setAllStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // 管理者パスワード（本番環境では必ず変更してください）
  const ADMIN_PASSWORD = 'saigai';

  // 初期データロード
  useEffect(() => {
    loadAllStaffData();
  }, []);

  const loadAllStaffData = async () => {
    setLoading(true);
    try {
      const result = await window.storage.list('staff:');
      if (result && result.keys) {
        const staffPromises = result.keys.map(async (key) => {
          const data = await window.storage.get(key);
          return data ? JSON.parse(data.value) : null;
        });
        const staffList = await Promise.all(staffPromises);
        setAllStaff(staffList.filter(s => s !== null));
      }
    } catch (error) {
      console.log('データ読み込みエラー:', error);
      setAllStaff([]);
    }
    setLoading(false);
  };

  // 全角数字を半角に変換
  const toHalfWidth = (str) => {
    return str.replace(/[０-９]/g, (s) => {
      return String.fromCharCode(s.charCodeAt(0) - 0xFEE0);
    });
  };

  const handleStaffInput = async () => {
    if (!staffId.trim()) {
      alert('職員IDを入力してください');
      return;
    }

    // 半角に変換
    const normalizedId = toHalfWidth(staffId.trim());
    
    // 半角数字のみかチェック
    if (!/^\d+$/.test(normalizedId)) {
      alert('職員IDは半角数字のみで入力してください');
      return;
    }

    setStaffId(normalizedId);

    try {
      const result = await window.storage.get(`staff:${normalizedId}`);
      if (result) {
        setStaffData(JSON.parse(result.value));
      } else {
        setStaffData({
          name: '',
          department: '',
          status: '',
          location: '',
          canReport: '',
          reportTime: '',
          comment: '',
          timestamp: ''
        });
      }
      setView('input');
    } catch (error) {
      setStaffData({
        name: '',
        department: '',
        status: '',
        location: '',
        canReport: '',
        reportTime: '',
        comment: '',
        timestamp: ''
      });
      setView('input');
    }
  };

  const saveStaffData = async () => {
    if (!staffData.name || !staffData.department || !staffData.status) {
      alert('氏名、所属部署、安否状況は必須です');
      return;
    }

    const dataToSave = {
      ...staffData,
      id: staffId,
      timestamp: new Date().toLocaleString('ja-JP')
    };

    try {
      await window.storage.set(`staff:${staffId}`, JSON.stringify(dataToSave));
      alert('登録しました');
      setView('select');
      setStaffId('');
    } catch (error) {
      alert('保存に失敗しました');
      console.error(error);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      '無事': 'bg-green-100 text-green-800 border-green-300',
      '軽傷': 'bg-yellow-100 text-yellow-800 border-yellow-300',
      '重傷': 'bg-red-100 text-red-800 border-red-300',
      '未確認': 'bg-gray-100 text-gray-800 border-gray-300'
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  const getStatusStats = () => {
    const stats = {
      '無事': 0,
      '軽傷': 0,
      '重傷': 0,
      '未確認': 0,
      '合計': allStaff.length
    };
    allStaff.forEach(staff => {
      if (stats[staff.status] !== undefined) {
        stats[staff.status]++;
      }
    });
    return stats;
  };

  const handleAdminLogin = () => {
    if (adminPassword === ADMIN_PASSWORD) {
      setView('admin');
      setAdminPassword('');
    } else {
      alert('パスワードが正しくありません');
      setAdminPassword('');
    }
  };

  if (view === 'select') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-md mx-auto pt-8">
          <div className="bg-white rounded-lg shadow-xl p-8">
            <div className="flex items-center justify-center mb-6">
              <AlertCircle className="w-12 h-12 text-red-600 mr-3" />
              <h1 className="text-2xl font-bold text-gray-800">災害時職員管理</h1>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  本部モード（管理者パスワード）
                </label>
                <input
                  type="password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="パスワードを入力"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent mb-3"
                  onKeyPress={(e) => e.key === 'Enter' && handleAdminLogin()}
                />
                <button
                  onClick={handleAdminLogin}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-4 px-6 rounded-lg transition duration-200 flex items-center justify-center"
                >
                  <Users className="w-5 h-5 mr-2" />
                  本部モード（全体確認）
                </button>
              </div>

              <div className="border-t pt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  職員モード（状況入力）
                </label>
                <input
                  type="text"
                  value={staffId}
                  onChange={(e) => setStaffId(e.target.value)}
                  placeholder="職員ID（半角数字のみ 例: 0001）"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-3"
                  onKeyPress={(e) => e.key === 'Enter' && handleStaffInput()}
                />
                <button
                  onClick={handleStaffInput}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition duration-200 flex items-center justify-center"
                >
                  <User className="w-5 h-5 mr-2" />
                  状況を入力する
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (view === 'input') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-2xl mx-auto pt-4">
          <div className="bg-white rounded-lg shadow-xl p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-800">職員情報入力</h2>
              <span className="text-sm text-gray-600">ID: {staffId}</span>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  氏名 <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  value={staffData.name}
                  onChange={(e) => setStaffData({...staffData, name: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="山田 太郎"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  所属部署 <span className="text-red-600">*</span>
                </label>
                <select
                  value={staffData.department}
                  onChange={(e) => setStaffData({...staffData, department: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">選択してください</option>
                  <option value="診療部">診療部</option>
                  <option value="看護部">看護部</option>
                  <option value="医療技術部">医療技術部</option>
                  <option value="薬剤部">薬剤部</option>
                  <option value="経営統括部">経営統括部</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  安否状況 <span className="text-red-600">*</span>
                </label>
                <select
                  value={staffData.status}
                  onChange={(e) => setStaffData({...staffData, status: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">選択してください</option>
                  <option value="無事">無事</option>
                  <option value="軽傷">軽傷</option>
                  <option value="重傷">重傷</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <MapPin className="inline w-4 h-4 mr-1" />
                  現在地
                </label>
                <input
                  type="text"
                  value={staffData.location}
                  onChange={(e) => setStaffData({...staffData, location: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="自宅、避難所、職場など"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Home className="inline w-4 h-4 mr-1" />
                  参集可否
                </label>
                <select
                  value={staffData.canReport}
                  onChange={(e) => setStaffData({...staffData, canReport: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">選択してください</option>
                  <option value="直ちに可能">直ちに可能</option>
                  <option value="数時間後">数時間後</option>
                  <option value="翌日以降">翌日以降</option>
                  <option value="不可能">不可能</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Clock className="inline w-4 h-4 mr-1" />
                  参集予定時刻
                </label>
                <input
                  type="text"
                  value={staffData.reportTime}
                  onChange={(e) => setStaffData({...staffData, reportTime: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="例: 14:00頃"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  備考・連絡事項
                </label>
                <textarea
                  value={staffData.comment}
                  onChange={(e) => setStaffData({...staffData, comment: e.target.value})}
                  rows="3"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="家族の状況、交通状況など"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setView('select');
                    setStaffId('');
                  }}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-3 px-6 rounded-lg transition duration-200"
                >
                  キャンセル
                </button>
                <button
                  onClick={saveStaffData}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition duration-200 flex items-center justify-center"
                >
                  <Save className="w-5 h-5 mr-2" />
                  登録する
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (view === 'admin') {
    const stats = getStatusStats();

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-6xl mx-auto pt-4">
          <div className="bg-white rounded-lg shadow-xl p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">本部管理画面</h2>
              <div className="flex gap-2">
                <button
                  onClick={loadAllStaffData}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition duration-200 flex items-center"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  更新
                </button>
                <button
                  onClick={() => setView('select')}
                  className="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded-lg transition duration-200"
                >
                  戻る
                </button>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">読み込み中...</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                  <div className="bg-blue-100 border-2 border-blue-300 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-blue-800">{stats['合計']}</div>
                    <div className="text-sm text-blue-600">合計</div>
                  </div>
                  <div className="bg-green-100 border-2 border-green-300 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-green-800">{stats['無事']}</div>
                    <div className="text-sm text-green-600">無事</div>
                  </div>
                  <div className="bg-yellow-100 border-2 border-yellow-300 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-yellow-800">{stats['軽傷']}</div>
                    <div className="text-sm text-yellow-600">軽傷</div>
                  </div>
                  <div className="bg-red-100 border-2 border-red-300 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-red-800">{stats['重傷']}</div>
                    <div className="text-sm text-red-600">重傷</div>
                  </div>
                  <div className="bg-gray-100 border-2 border-gray-300 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-gray-800">{stats['未確認']}</div>
                    <div className="text-sm text-gray-600">未確認</div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-100 border-b-2 border-gray-300">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">ID</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">氏名</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">所属部署</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">安否</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">現在地</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">参集可否</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">予定時刻</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">備考</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">更新時刻</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {allStaff.length === 0 ? (
                        <tr>
                          <td colSpan="9" className="px-4 py-8 text-center text-gray-500">
                            登録されているデータがありません
                          </td>
                        </tr>
                      ) : (
                        allStaff.map((staff) => (
                          <tr key={staff.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm font-medium text-gray-900">{staff.id}</td>
                            <td className="px-4 py-3 text-sm text-gray-900">{staff.name}</td>
                            <td className="px-4 py-3 text-sm text-gray-700">{staff.department || '-'}</td>
                            <td className="px-4 py-3">
                              <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(staff.status)}`}>
                                {staff.status}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-700">{staff.location || '-'}</td>
                            <td className="px-4 py-3 text-sm text-gray-700">{staff.canReport || '-'}</td>
                            <td className="px-4 py-3 text-sm text-gray-700">{staff.reportTime || '-'}</td>
                            <td className="px-4 py-3 text-sm text-gray-700 max-w-xs truncate">{staff.comment || '-'}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">{staff.timestamp}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }
};

export default DisasterManagementApp;