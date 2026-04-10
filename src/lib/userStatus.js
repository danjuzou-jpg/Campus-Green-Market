export const getUserDisplayStatus = (profile) => {
  if (!profile) return 'unverified';

  // Extract status and creation date, with fallbacks
  const status = profile.verification_status || 'unverified';
  const createdAtStr = profile.created_at || '';

  // If user is literally marked verified, we keep it as verified unless we want 
  // the 3 month rule to also strip verified? 
  // User said: "无论是还没验证的普通人、还是已经被你通过验证的「新生」，只要账号注册满 90 天且始终没有进行最终的 .edu.my 校园邮箱验证，一律剥夺特殊身份"
  // If they HAVE verified .edu.my, their status is 'verified', so they are SAFE.
  if (status === 'verified') return 'verified';

  // For unverified or freshman/pending candidates, check the 90 days limit.
  if (createdAtStr) {
    const createdAt = new Date(createdAtStr).getTime();
    const now = Date.now();
    const daysSinceRegistration = (now - createdAt) / (1000 * 60 * 60 * 24);
    
    // If over 90 days and NOT 'verified', they become 'stranger'
    if (daysSinceRegistration > 90) {
      return 'stranger'; // ⚠️ Stranger
    }
  }

  // Not expired, so return their genuine state
  return status;
};
