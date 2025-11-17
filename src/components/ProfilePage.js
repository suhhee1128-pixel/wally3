import React, { useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { trackLogout } from '../lib/analytics';
import profileImage from '../assets/profile.jpg';

function ProfilePage() {
  const { user, signOut } = useAuth();
  const [showEditModal, setShowEditModal] = useState(false);
  const [nickname, setNickname] = useState('');
  const [profileImageUrl, setProfileImageUrl] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef(null);

  const handleLogout = async () => {
    if (window.confirm('로그아웃하시겠습니까?')) {
      trackLogout(); // 로그아웃 추적
      await signOut();
    }
  };

  const displayName =
    user?.user_metadata?.name ||
    user?.user_metadata?.nickname ||
    user?.email?.split('@')[0] ||
    'Guest';

  const currentProfileImage = user?.user_metadata?.avatar_url || profileImage;

  // 프로필 편집 모달 열기
  const handleManageProfile = () => {
    setNickname(displayName);
    setProfileImageUrl(currentProfileImage);
    setShowEditModal(true);
  };

  // 프로필 사진 선택
  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 이미지 파일인지 확인
    if (!file.type.startsWith('image/')) {
      alert('이미지 파일만 업로드할 수 있습니다.');
      return;
    }

    // 파일 크기 확인 (5MB 제한)
    if (file.size > 5 * 1024 * 1024) {
      alert('파일 크기는 5MB 이하여야 합니다.');
      return;
    }

    setUploading(true);
    const reader = new FileReader();
    reader.onloadend = () => {
      setProfileImageUrl(reader.result);
      setUploading(false);
    };
    reader.readAsDataURL(file);
  };

  // 프로필 사진 업로드 (Supabase Storage)
  const uploadProfileImage = async (file) => {
    if (!user) return null;

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      // 사용자 ID를 폴더명으로 사용하여 RLS 정책과 일치시킴
      const filePath = `${user.id}/${fileName}`;

      // Supabase Storage에 업로드
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true  // 같은 파일이 있으면 덮어쓰기
        });

      if (uploadError) {
        console.error('Storage upload failed:', uploadError);
        // Storage bucket이 없거나 권한 문제일 수 있음
        alert('사진 업로드에 실패했습니다. Supabase Storage 설정을 확인해주세요.');
        return null;
      }

      // Public URL 가져오기
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      console.log('Image uploaded successfully:', publicUrl);
      return publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('사진 업로드 중 오류가 발생했습니다.');
      return null;
    }
  };

  // 프로필 저장
  const handleSaveProfile = async () => {
    if (!user) {
      alert('로그인이 필요합니다.');
      return;
    }

    if (!nickname.trim()) {
      alert('닉네임을 입력해주세요.');
      return;
    }

    setSaving(true);
    try {
      let avatarUrl = profileImageUrl || currentProfileImage;

      // 새 이미지 파일이 선택된 경우에만 업로드 시도
      const selectedFile = fileInputRef.current?.files?.[0];
      if (selectedFile && profileImageUrl?.startsWith('data:')) {
        console.log('Uploading new profile image...');
        const uploadedUrl = await uploadProfileImage(selectedFile);
        if (uploadedUrl) {
          avatarUrl = uploadedUrl;
          console.log('Image uploaded successfully:', uploadedUrl);
        } else {
          console.warn('Image upload failed, using existing image');
          // 업로드 실패 시 기존 이미지 유지
          avatarUrl = currentProfileImage;
        }
      } else if (!profileImageUrl || profileImageUrl === currentProfileImage) {
        // 이미지가 변경되지 않은 경우 기존 이미지 유지
        avatarUrl = currentProfileImage;
      }

      console.log('Updating user profile:', { nickname, avatarUrl });

      // Supabase user metadata 업데이트
      const { data: updatedUser, error } = await supabase.auth.updateUser({
        data: {
          name: nickname.trim(),
          nickname: nickname.trim(),
          avatar_url: avatarUrl
        }
      });

      if (error) {
        console.error('Supabase updateUser error:', error);
        throw error;
      }

      console.log('Profile updated successfully:', updatedUser);

      // 성공 메시지
      alert('프로필이 업데이트되었습니다!');
      setShowEditModal(false);
      
      // 페이지 새로고침하여 변경사항 반영
      window.location.reload();
    } catch (error) {
      console.error('Error updating profile:', error);
      const errorMessage = error.message || '알 수 없는 오류가 발생했습니다.';
      alert(`프로필 업데이트 중 오류가 발생했습니다: ${errorMessage}`);
    } finally {
      setSaving(false);
    }
  };

  // Account 섹션 아이템
  const accountItems = [
    {
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
      label: 'Manage Profile',
      onClick: handleManageProfile
    },
    {
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      ),
      label: 'Password & Security'
    },
    {
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
      ),
      label: 'Notifications'
    },
    {
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
        </svg>
      ),
      label: 'Language',
      value: 'English',
      showArrow: false
    }
  ];

  // Preferences 섹션 아이템
  const preferencesItems = [
    {
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
      label: 'About Us'
    },
    {
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
      label: 'Theme',
      value: 'Light'
    },
    {
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      label: 'Appointments'
    }
  ];

  // Support 섹션 아이템
  const supportItems = [
    {
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      label: 'Help Center'
    }
  ];

  const MenuItem = ({ icon, label, value, onClick, showArrow = true }) => {
    const isDisabled = !onClick;
    return (
      <button
        onClick={onClick}
        disabled={isDisabled}
        className={`w-full flex items-center ${showArrow ? 'justify-between' : ''} py-4 px-5 transition-colors ${
          isDisabled ? 'cursor-default' : 'hover:bg-gray-50'
        }`}
      >
        <div className="flex items-center gap-3">
          <div className={isDisabled ? 'text-gray-400' : 'text-gray-700'}>{icon}</div>
          <span className={`text-sm font-medium ${isDisabled ? 'text-gray-400' : 'text-gray-900'}`}>{label}</span>
          {value && <span className={`text-sm ml-2 ${isDisabled ? 'text-gray-400' : 'text-gray-500'}`}>({value})</span>}
        </div>
        {showArrow && (
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
          </svg>
        )}
      </button>
    );
  };

  const Section = ({ title, items }) => (
    <div className="mb-6">
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-1">
        {title}
      </h3>
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        {items.map((item, index) => (
          <div key={index}>
            <MenuItem {...item} />
            {index < items.length - 1 && <div className="border-t border-gray-100 mx-5" />}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-24 relative">
      <div className="px-6 pt-4 pb-6">
        <h1 className="text-xl font-semibold text-gray-900 text-center mb-6">Profile</h1>

        {/* 프로필 카드 */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full overflow-hidden flex-shrink-0">
              <img 
                src={currentProfileImage} 
                alt="Profile" 
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-[#F35DC8] mb-1">{displayName}</h2>
              <p className="text-sm text-gray-500">{user?.email || 'No email connected'}</p>
            </div>
          </div>
        </div>

        {/* Account 섹션 */}
        <Section title="Account" items={accountItems} />

        {/* Preferences 섹션 */}
        <Section title="Preferences" items={preferencesItems} />

        {/* Support 섹션 */}
        <Section title="Support" items={supportItems} />

        {/* Logout 버튼 */}
        <div className="mt-6">
          <button
            onClick={handleLogout}
            className="w-full bg-white rounded-2xl shadow-sm py-4 px-5 flex items-center justify-center gap-3 hover:bg-red-50 transition-colors group"
          >
            <svg 
              className="w-5 h-5 text-red-500 group-hover:text-red-600" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth="2" 
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" 
              />
            </svg>
            <span className="text-sm font-medium text-red-500 group-hover:text-red-600">
              Logout
            </span>
          </button>
        </div>
      </div>

      {/* 프로필 편집 모달 */}
      {showEditModal && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 p-4 pt-16">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-[calc(100%-2rem)] max-h-[calc(100%-2rem)] overflow-y-auto p-6 mt-4">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">프로필 편집</h2>
            
            {/* 프로필 사진 */}
            <div className="flex flex-col items-center mb-6">
              <div className="relative">
                <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-gray-100">
                  <img 
                    src={profileImageUrl || currentProfileImage} 
                    alt="Profile" 
                    className="w-full h-full object-cover"
                  />
                </div>
                {uploading && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-full">
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="mt-3 text-sm text-[#F35DC8] font-medium hover:text-[#E040B5] disabled:opacity-50"
              >
                {uploading ? '업로드 중...' : '사진 변경'}
              </button>
            </div>

            {/* 닉네임 입력 */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                닉네임
              </label>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="닉네임을 입력하세요"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F35DC8] focus:border-transparent"
                maxLength={20}
              />
            </div>

            {/* 버튼 */}
            <div className="flex gap-3">
              <button
                onClick={() => setShowEditModal(false)}
                className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleSaveProfile}
                disabled={saving || !nickname.trim()}
                className="flex-1 px-4 py-3 bg-[#F35DC8] text-white rounded-lg font-medium hover:bg-[#E040B5] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {saving ? '저장 중...' : '저장'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProfilePage;

