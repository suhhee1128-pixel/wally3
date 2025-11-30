import React, { useState, useRef, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { trackLogout } from '../lib/analytics';
import profileImage from '../assets/profile.jpg';

function ProfilePage() {
  const { user, signOut } = useAuth();
  const [showEditModal, setShowEditModal] = useState(false);
  const [nickname, setNickname] = useState('');
  const [profileImageUrl, setProfileImageUrl] = useState(null);
  const [selectedImageFile, setSelectedImageFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const fileInputRef = useRef(null);

  // 프로필 정보 로드 (user_profiles 테이블에서)
  React.useEffect(() => {
    const loadUserProfile = async () => {
      if (!user) {
        setLoadingProfile(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('user_profiles')
          .select('nickname, avatar_url')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error && error.code !== 'PGRST116') {
          console.error('Error loading user profile:', error);
        }

        if (data) {
          setUserProfile(data);
        }
        setLoadingProfile(false);
      } catch (error) {
        console.error('Error loading user profile:', error);
        setLoadingProfile(false);
      }
    };

    loadUserProfile();
  }, [user]);

  const handleLogout = async () => {
    if (window.confirm('로그아웃하시겠습니까?')) {
      trackLogout(); // 로그아웃 추적
      await signOut();
    }
  };

  // 프로필 정보 표시 (user_profiles 우선, 없으면 user_metadata, 없으면 기본값)
  const displayName =
    userProfile?.nickname ||
    user?.user_metadata?.name ||
    user?.user_metadata?.nickname ||
    user?.email?.split('@')[0] ||
    'Guest';

  const currentProfileImage = useMemo(() => {
    const avatarUrl = userProfile?.avatar_url || user?.user_metadata?.avatar_url;
    // URL인 경우 캐시 무효화를 위해 타임스탬프 추가
    if (avatarUrl && avatarUrl.startsWith('http')) {
      return `${avatarUrl}?t=${userProfile?.updated_at || Date.now()}`;
    }
    return avatarUrl || profileImage;
  }, [userProfile?.avatar_url, userProfile?.updated_at, user?.user_metadata?.avatar_url]);

  // 프로필 편집 모달 열기
  const handleManageProfile = () => {
    setNickname(displayName);
    setProfileImageUrl(currentProfileImage);
    setSelectedImageFile(null);
    setShowEditModal(true);
  };

  // 프로필 사진 선택
  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    console.log('File selected:', file);
    
    if (!file) {
      console.log('No file selected');
      return;
    }

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

    // 선택한 파일을 state에 저장 (나중에 업로드할 때 사용)
    setSelectedImageFile(file);
    console.log('Selected file saved to state:', file.name, file.size);

    // 미리보기를 위해 FileReader로 읽기
    setUploading(true);
    const reader = new FileReader();
    reader.onloadend = () => {
      console.log('Image preview loaded, size:', reader.result?.length);
      setProfileImageUrl(reader.result);
      setUploading(false);
    };
    reader.onerror = (error) => {
      console.error('Error reading file:', error);
      alert('이미지를 읽는 중 오류가 발생했습니다.');
      setUploading(false);
      setSelectedImageFile(null);
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

      console.log('Attempting to upload to:', filePath);
      console.log('File details:', { name: file.name, size: file.size, type: file.type });
      
      // Supabase Storage에 업로드 (bucket 확인 없이 바로 시도)
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true  // 같은 파일이 있으면 덮어쓰기
        });

      if (uploadError) {
        console.error('Storage upload failed:', uploadError);
        console.error('Upload error details:', {
          message: uploadError.message,
          statusCode: uploadError.statusCode,
          error: uploadError.error,
          filePath: filePath,
          userId: user.id,
          fileName: fileName
        });
        
        // 더 구체적인 에러 메시지
        let errorMessage = '사진 업로드에 실패했습니다.\n\n';
        if (uploadError.message) {
          if (uploadError.message.includes('Bucket not found') || uploadError.message.includes('bucket')) {
            errorMessage += 'Storage bucket이 설정되지 않았습니다.\nSupabase Dashboard > Storage에서 avatars bucket을 생성해주세요.';
          } else if (uploadError.message.includes('row-level security') || uploadError.message.includes('RLS')) {
            errorMessage += '업로드 권한이 없습니다.\nStorage RLS 정책을 확인하거나 setup_storage.sql을 실행해주세요.';
          } else if (uploadError.message.includes('duplicate') || uploadError.message.includes('already exists')) {
            // 중복 파일 오류는 무시하고 계속 진행 (upsert가 있으므로)
            console.log('File already exists, but upsert should handle this');
          } else {
            errorMessage += `오류: ${uploadError.message}`;
          }
        } else {
          errorMessage += '자세한 내용은 브라우저 콘솔을 확인해주세요.';
        }
        alert(errorMessage);
        return null;
      }
      
      console.log('Upload successful:', uploadData);

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
      let avatarUrl = currentProfileImage;

      // 새 이미지 파일이 선택된 경우에만 업로드 시도
      if (selectedImageFile) {
        console.log('Uploading new profile image...', selectedImageFile.name);
        const uploadedUrl = await uploadProfileImage(selectedImageFile);
        if (uploadedUrl) {
          avatarUrl = uploadedUrl;
          console.log('Image uploaded successfully:', uploadedUrl);
        } else {
          console.warn('Image upload failed, using existing image');
          // 업로드 실패 시 기존 이미지 유지
          avatarUrl = currentProfileImage;
        }
      } else {
        // 이미지가 변경되지 않은 경우 기존 이미지 유지
        avatarUrl = currentProfileImage;
      }

      console.log('Updating user profile:', { nickname, avatarUrl });

      // 1. user_profiles 테이블에 저장 (Google OAuth 로그인 시에도 유지됨)
      const { data: existingProfile } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      const profileData = {
        nickname: nickname.trim(),
        avatar_url: avatarUrl,
        updated_at: new Date().toISOString()
      };

      let profileError = null;
      if (existingProfile) {
        // 업데이트
        const { error } = await supabase
          .from('user_profiles')
          .update(profileData)
          .eq('user_id', user.id);
        profileError = error;
      } else {
        // 삽입
        const { error } = await supabase
          .from('user_profiles')
          .insert({
            user_id: user.id,
            ...profileData
          });
        profileError = error;
      }

      if (profileError) {
        console.error('Error saving to user_profiles:', profileError);
        throw profileError;
      }

      // 2. user_metadata에도 저장 (호환성을 위해)
      const { data: updatedUser, error: metadataError } = await supabase.auth.updateUser({
        data: {
          name: nickname.trim(),
          nickname: nickname.trim(),
          avatar_url: avatarUrl
        }
      });

      if (metadataError) {
        console.warn('Warning: Failed to update user_metadata:', metadataError);
        // user_profiles에 저장되었으므로 계속 진행
      }

      console.log('Profile saved to user_profiles successfully');
      console.log('Profile data:', profileData);

      // 저장 확인: user_profiles에서 확인
      const { data: verifiedProfile } = await supabase
        .from('user_profiles')
        .select('nickname, avatar_url')
        .eq('user_id', user.id)
        .maybeSingle();

      if (verifiedProfile) {
        setUserProfile(verifiedProfile);
        console.log('Verified profile:', verifiedProfile);
      }

      // 성공 메시지
      alert('프로필이 업데이트되었습니다!');
      setShowEditModal(false);
      
      // 파일 선택 초기화
      setSelectedImageFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      // 프로필 다시 로드하여 최신 데이터 가져오기
      const { data: reloadedProfile } = await supabase
        .from('user_profiles')
        .select('nickname, avatar_url')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (reloadedProfile) {
        setUserProfile(reloadedProfile);
      }
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
                key={userProfile?.avatar_url || user?.user_metadata?.avatar_url || 'default'}
                onError={(e) => {
                  e.target.src = profileImage;
                }}
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
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedImageFile(null);
                  setProfileImageUrl(currentProfileImage);
                  if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                  }
                }}
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

