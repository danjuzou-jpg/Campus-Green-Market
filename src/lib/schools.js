// 马来西亚大学列表 — 邮箱后缀已通过官方渠道核实
// 用于: 注册时邮箱后缀识别学校 + 首页学校筛选栏

export const MALAYSIAN_UNIVERSITIES = [
  {
    key: 'UM',
    en: 'Universiti Malaya (UM)',
    zh: '马来亚大学 (UM)',
    emailSuffixes: ['siswa.um.edu.my', 'um.edu.my'],
    lat: 3.1209, lng: 101.6538
  },
  {
    key: 'USM',
    en: 'Universiti Sains Malaysia (USM)',
    zh: '马来西亚理科大学 (USM)',
    emailSuffixes: ['student.usm.my', 'usm.my'],
    lat: 5.3563, lng: 100.3024
  },
  {
    key: 'UKM',
    en: 'Universiti Kebangsaan Malaysia (UKM)',
    zh: '马来西亚国民大学 (UKM)',
    emailSuffixes: ['siswa.ukm.edu.my', 'ukm.edu.my'],
    lat: 2.9264, lng: 101.7781
  },
  {
    key: 'UPM',
    en: 'Universiti Putra Malaysia (UPM)',
    zh: '马来西亚博特拉大学 (UPM)',
    emailSuffixes: ['student.upm.edu.my', 'upm.edu.my'],
    lat: 2.9981, lng: 101.7065
  },
  {
    key: 'UTM',
    en: 'Universiti Teknologi Malaysia (UTM)',
    zh: '马来西亚理工大学 (UTM)',
    emailSuffixes: ['graduate.utm.my', 'utm.my'],
    lat: 1.5594, lng: 103.6370
  },
  {
    key: 'TAYLORS',
    en: "Taylor's University",
    zh: '泰莱大学',
    emailSuffixes: ['sd.taylors.edu.my', 'taylors.edu.my'],
    lat: 3.0637, lng: 101.6170
  },
  {
    key: 'SUNWAY',
    en: 'Sunway University',
    zh: '双威大学',
    emailSuffixes: ['imail.sunway.edu.my', 'sunway.edu.my'],
    lat: 3.0679, lng: 101.6049
  },
  {
    key: 'UCSI',
    en: 'UCSI University',
    zh: '思特雅大学',
    emailSuffixes: ['student.ucsiuniversity.edu.my', 'ucsiuniversity.edu.my'],
    lat: 3.0585, lng: 101.6924
  },
  {
    key: 'APU',
    en: 'Asia Pacific University (APU)',
    zh: '亚太科技大学 (APU)',
    emailSuffixes: ['mail.apu.edu.my', 'apu.edu.my'],
    lat: 3.0553, lng: 101.6946
  },
  {
    key: 'XMUM',
    en: 'Xiamen University Malaysia (XMUM)',
    zh: '厦门大学马来西亚分校 (XMUM)',
    emailSuffixes: ['xmu.edu.my'],
    lat: 2.7640, lng: 101.7151
  },
  {
    key: 'MONASH',
    en: 'Monash University Malaysia',
    zh: '莫纳什大学马来西亚分校',
    emailSuffixes: ['student.monash.edu', 'monash.edu.my', 'monash.edu'],
    lat: 3.0644, lng: 101.6012
  },
  {
    key: 'NOTTINGHAM',
    en: 'University of Nottingham Malaysia',
    zh: '诺丁汉大学马来西亚分校',
    emailSuffixes: ['nottingham.edu.my'],
    lat: 2.9459, lng: 101.8741
  },
  {
    key: 'HW',
    en: 'Heriot-Watt University Malaysia',
    zh: '赫瑞瓦特大学马来西亚分校',
    emailSuffixes: ['hw.ac.uk'],
    lat: 2.9375, lng: 101.8749
  },
  {
    key: 'MMU',
    en: 'Multimedia University (MMU)',
    zh: '多媒体大学 (MMU)',
    emailSuffixes: ['mmu.edu.my'],
    lat: 2.9270, lng: 101.6426
  },
  {
    key: 'HELP',
    en: 'HELP University',
    zh: '精英大学',
    emailSuffixes: ['helplive.edu.my', 'help.edu.my'],
    lat: 3.1098, lng: 101.6587
  }
]

/**
 * 通过邮箱后缀检测学校
 * @param {string} email — 用户输入的邮箱
 * @returns {object|null} — 匹配的学校对象 或 null
 */
export const detectSchoolFromEmail = (email) => {
  if (!email || !email.includes('@')) return null
  const domain = email.toLowerCase().split('@').pop()
  for (const uni of MALAYSIAN_UNIVERSITIES) {
    if (uni.emailSuffixes.some(suffix => domain === suffix || domain.endsWith('.' + suffix))) {
      return uni
    }
  }
  return null
}

/**
 * 检查邮箱是否在白名单中（用于注册验证）
 * 接受: 白名单域名 || .edu.my 后缀
 * @param {string} email
 * @returns {boolean}
 */
export const isAllowedStudentEmail = (email) => {
  if (!email || !email.includes('@')) return false
  const domain = email.toLowerCase().split('@').pop()

  // 1. 检查是否匹配任何已知学校域名
  for (const uni of MALAYSIAN_UNIVERSITIES) {
    if (uni.emailSuffixes.some(suffix => domain === suffix || domain.endsWith('.' + suffix))) {
      return true
    }
  }

  // 2. 其他 .edu.my 后缀也允许（未知学校需手动选择）
  if (domain.endsWith('.edu.my')) return true

  return false
}
