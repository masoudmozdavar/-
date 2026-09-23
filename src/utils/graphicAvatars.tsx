import React from 'react';

export interface GraphicCharacter {
  id: string;
  nameFa: string;
  nameEn: string;
  titleFa: string;
  titleEn: string;
  tag: 'head' | 'spouse' | 'child' | 'parent' | 'pro';
  accentColor: string;
  gradientBg: string;
  badgeEmoji: string;
  descriptionFa: string;
  renderSvg: (props?: { className?: string; size?: number }) => React.ReactElement;
}

export const GRAPHIC_CHARACTERS: GraphicCharacter[] = [
  {
    id: 'char_masoud',
    nameFa: 'مسعود (مدیر ارشد)',
    nameEn: 'Masoud (Executive)',
    titleFa: 'سرپرست و مدیر ارشد مالی',
    titleEn: 'Head & Chief Executive',
    tag: 'head',
    accentColor: '#3b82f6',
    gradientBg: 'from-blue-600 via-indigo-600 to-cyan-500',
    badgeEmoji: '👑',
    descriptionFa: 'مدیر مصمم، مسلط به دخل‌وخرج و برنامه‌ریزی استراتژیک خانواده',
    renderSvg: ({ className = 'w-full h-full', size } = {}) => (
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        width={size}
        height={size}
      >
        <defs>
          <linearGradient id="gm_bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1e3a8a" />
            <stop offset="50%" stopColor="#2563eb" />
            <stop offset="100%" stopColor="#06b6d4" />
          </linearGradient>
          <linearGradient id="gm_suit" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0f172a" />
            <stop offset="100%" stopColor="#1e293b" />
          </linearGradient>
          <linearGradient id="gm_skin" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#fed7aa" />
            <stop offset="100%" stopColor="#fdba74" />
          </linearGradient>
          <linearGradient id="gm_hair" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1e293b" />
            <stop offset="100%" stopColor="#0f172a" />
          </linearGradient>
          <linearGradient id="gm_gold" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fbbf24" />
            <stop offset="100%" stopColor="#d97706" />
          </linearGradient>
        </defs>

        {/* Outer Ring & Backdrop */}
        <circle cx="50" cy="50" r="48" fill="url(#gm_bg)" />
        <circle cx="50" cy="50" r="44" stroke="white" strokeOpacity="0.25" strokeWidth="1.5" />
        <circle cx="50" cy="50" r="41" fill="#1e293b" fillOpacity="0.15" />

        {/* Ambient Glow */}
        <circle cx="50" cy="30" r="25" fill="#60a5fa" fillOpacity="0.3" filter="blur(6px)" />

        {/* Suit & Shoulders */}
        <path d="M18 95 C22 75, 34 68, 50 68 C66 68, 78 75, 82 95 Z" fill="url(#gm_suit)" />
        {/* Shirt Collar */}
        <path d="M42 68 L50 82 L58 68 Z" fill="#ffffff" />
        {/* Modern Tie */}
        <path d="M48 76 L52 76 L53 92 L50 96 L47 92 Z" fill="url(#gm_gold)" />

        {/* Neck */}
        <rect x="44" y="58" width="12" height="13" rx="4" fill="url(#gm_skin)" />

        {/* Head Base */}
        <ellipse cx="50" cy="45" rx="18" ry="21" fill="url(#gm_skin)" />

        {/* Ears */}
        <circle cx="31" cy="47" r="4.5" fill="url(#gm_skin)" />
        <circle cx="69" cy="47" r="4.5" fill="url(#gm_skin)" />

        {/* Modern Haircut */}
        <path
          d="M32 42 C30 28, 42 21, 50 21 C62 21, 70 28, 68 42 C65 33, 56 31, 50 31 C42 31, 35 34, 32 42 Z"
          fill="url(#gm_hair)"
        />
        <path d="M32 37 Q42 27 58 29 Q68 31 68 39 Q52 32 32 37 Z" fill="#334155" />

        {/* Smart Glasses */}
        <rect x="36" y="41" width="11" height="7.5" rx="2.5" fill="#3b82f6" fillOpacity="0.2" stroke="#0f172a" strokeWidth="1.8" />
        <rect x="53" y="41" width="11" height="7.5" rx="2.5" fill="#3b82f6" fillOpacity="0.2" stroke="#0f172a" strokeWidth="1.8" />
        <line x1="47" y1="44" x2="53" y2="44" stroke="#0f172a" strokeWidth="1.8" />
        {/* Eyebrows */}
        <path d="M37 38 Q42 36 46 38" stroke="#1e293b" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M54 38 Q58 36 63 38" stroke="#1e293b" strokeWidth="1.8" strokeLinecap="round" />

        {/* Eyes (behind glasses) */}
        <circle cx="41.5" cy="44.5" r="1.5" fill="#0f172a" />
        <circle cx="58.5" cy="44.5" r="1.5" fill="#0f172a" />
        <circle cx="42" cy="44" r="0.6" fill="white" />
        <circle cx="59" cy="44" r="0.6" fill="white" />

        {/* Nose */}
        <path d="M50 46 L49 51 L52 51" stroke="#ea580c" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />

        {/* Confident Smile */}
        <path d="M44 56 Q50 60 56 56" stroke="#c2410c" strokeWidth="1.6" strokeLinecap="round" fill="none" />

        {/* Head Crown Mini Badge */}
        <g transform="translate(68, 12)">
          <circle cx="10" cy="10" r="10" fill="url(#gm_gold)" />
          <path d="M5 14 L6 8 L9 11 L11 7 L13 11 L16 8 L17 14 Z" fill="#78350f" />
        </g>
      </svg>
    ),
  },
  {
    id: 'char_maryam',
    nameFa: 'مریم (مدیر خانه)',
    nameEn: 'Maryam (Matron)',
    titleFa: 'بانوی مدبر و هماهنگ‌کننده',
    titleEn: 'Finance Matron & Strategist',
    tag: 'spouse',
    accentColor: '#ec4899',
    gradientBg: 'from-pink-600 via-rose-500 to-amber-400',
    badgeEmoji: '💎',
    descriptionFa: 'مدیریت دقیق بودجه خریدهای خانه، مهربان و ریزبین در هزینه‌ها',
    renderSvg: ({ className = 'w-full h-full', size } = {}) => (
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        width={size}
        height={size}
      >
        <defs>
          <linearGradient id="gm_mary_bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#db2777" />
            <stop offset="50%" stopColor="#f43f5e" />
            <stop offset="100%" stopColor="#fb923c" />
          </linearGradient>
          <linearGradient id="gm_mary_dress" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#831843" />
            <stop offset="100%" stopColor="#be185d" />
          </linearGradient>
          <linearGradient id="gm_mary_hair" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#451a03" />
            <stop offset="100%" stopColor="#78350f" />
          </linearGradient>
        </defs>

        <circle cx="50" cy="50" r="48" fill="url(#gm_mary_bg)" />
        <circle cx="50" cy="50" r="44" stroke="white" strokeOpacity="0.25" strokeWidth="1.5" />

        {/* Long Soft Hair Back */}
        <path d="M26 35 C22 55, 24 75, 34 85 C42 75, 58 75, 66 85 C76 75, 78 55, 74 35 Z" fill="url(#gm_mary_hair)" />

        {/* Elegant Blouse */}
        <path d="M20 95 C25 76, 36 70, 50 70 C64 70, 75 76, 80 95 Z" fill="url(#gm_mary_dress)" />
        <circle cx="50" cy="74" r="2.5" fill="#fef08a" />
        <path d="M45 70 C48 76, 52 76, 55 70" stroke="#fbcfe8" strokeWidth="1.5" fill="none" />

        {/* Neck */}
        <rect x="45" y="58" width="10" height="13" rx="3" fill="#fed7aa" />
        {/* Pearl Necklace */}
        <ellipse cx="50" cy="67" rx="6" ry="2" stroke="#ffffff" strokeWidth="1.5" fill="none" strokeDasharray="2 2" />

        {/* Face */}
        <ellipse cx="50" cy="45" rx="16.5" ry="19.5" fill="#fed7aa" />

        {/* Front Hair & Curls */}
        <path
          d="M33 42 C30 26, 42 22, 50 22 C64 22, 70 28, 67 42 C62 30, 53 30, 48 30 C40 30, 35 34, 33 42 Z"
          fill="url(#gm_mary_hair)"
        />
        <path d="M66 38 C68 48, 69 58, 64 66 C61 58, 63 48, 65 38 Z" fill="#78350f" />
        <path d="M34 38 C32 48, 31 58, 36 66 C39 58, 37 48, 35 38 Z" fill="#78350f" />

        {/* Pearl Earrings */}
        <circle cx="33" cy="48" r="2.5" fill="#ffffff" stroke="#fbcfe8" strokeWidth="0.8" />
        <circle cx="67" cy="48" r="2.5" fill="#ffffff" stroke="#fbcfe8" strokeWidth="0.8" />

        {/* Big Expressive Eyes */}
        <ellipse cx="43" cy="44" rx="2.5" ry="3" fill="#451a03" />
        <ellipse cx="57" cy="44" rx="2.5" ry="3" fill="#451a03" />
        <circle cx="44" cy="43" r="1" fill="#ffffff" />
        <circle cx="58" cy="43" r="1" fill="#ffffff" />

        {/* Eyelashes */}
        <path d="M39 42 Q43 39 47 41" stroke="#451a03" strokeWidth="1.5" strokeLinecap="round" fill="none" />
        <path d="M53 41 Q57 39 61 42" stroke="#451a03" strokeWidth="1.5" strokeLinecap="round" fill="none" />

        {/* Cheeks Blush */}
        <ellipse cx="38" cy="50" rx="3.5" ry="2" fill="#fb7185" fillOpacity="0.4" />
        <ellipse cx="62" cy="50" rx="3.5" ry="2" fill="#fb7185" fillOpacity="0.4" />

        {/* Sweet Smile */}
        <path d="M45 54 Q50 58 55 54" stroke="#be123c" strokeWidth="1.8" strokeLinecap="round" fill="none" />

        {/* Badge Icon */}
        <g transform="translate(68, 12)">
          <circle cx="10" cy="10" r="10" fill="#f43f5e" />
          <path d="M10 6 L12 10 L16 10 L13 13 L14 17 L10 14 L6 17 L7 13 L4 10 L8 10 Z" fill="#fef08a" />
        </g>
      </svg>
    ),
  },
  {
    id: 'char_sara',
    nameFa: 'سارا (دانشجو و خلاق)',
    nameEn: 'Sara (Student)',
    titleFa: 'فرزند ارشد، دانشجو و هنرمند',
    titleEn: 'Student & Creative Mind',
    tag: 'child',
    accentColor: '#a855f7',
    gradientBg: 'from-purple-600 via-fuchsia-600 to-indigo-500',
    badgeEmoji: '🎧',
    descriptionFa: 'علاقه‌مند به تکنولوژی، کتاب و هنر، با انگیزه برای پس‌انداز هدفمند',
    renderSvg: ({ className = 'w-full h-full', size } = {}) => (
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        width={size}
        height={size}
      >
        <defs>
          <linearGradient id="gm_sara_bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#7e22ce" />
            <stop offset="50%" stopColor="#c026d3" />
            <stop offset="100%" stopColor="#6366f1" />
          </linearGradient>
          <linearGradient id="gm_sara_hair" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#581c87" />
            <stop offset="100%" stopColor="#3b0764" />
          </linearGradient>
        </defs>

        <circle cx="50" cy="50" r="48" fill="url(#gm_sara_bg)" />
        <circle cx="50" cy="50" r="44" stroke="white" strokeOpacity="0.25" strokeWidth="1.5" />

        {/* Hoodie / Casual Jacket */}
        <path d="M22 95 C26 78, 38 72, 50 72 C62 72, 74 78, 78 95 Z" fill="#312e81" />
        <path d="M42 72 L50 84 L58 72 Z" fill="#e0e7ff" />
        <circle cx="50" cy="80" r="1.5" fill="#a855f7" />

        {/* Headphones around Neck */}
        <path d="M32 64 C32 78, 68 78, 68 64" stroke="#06b6d4" strokeWidth="4" strokeLinecap="round" fill="none" />
        <rect x="29" y="58" width="6" height="11" rx="3" fill="#0891b2" />
        <rect x="65" y="58" width="6" height="11" rx="3" fill="#0891b2" />

        {/* Neck */}
        <rect x="45" y="56" width="10" height="12" rx="3" fill="#fde68a" />

        {/* Bob Hair Back */}
        <ellipse cx="50" cy="46" rx="21" ry="20" fill="url(#gm_sara_hair)" />

        {/* Face */}
        <ellipse cx="50" cy="46" rx="16" ry="18" fill="#fde68a" />

        {/* Trendy Bangs / Front Hair */}
        <path
          d="M33 42 C32 28, 43 23, 50 23 C62 23, 68 28, 67 42 C60 33, 53 32, 48 32 C41 32, 36 36, 33 42 Z"
          fill="url(#gm_sara_hair)"
        />

        {/* Hair Clip */}
        <rect x="33" y="32" width="7" height="3" rx="1.5" fill="#22d3ee" transform="rotate(-15 33 32)" />

        {/* Big Bright Eyes */}
        <ellipse cx="43" cy="45" rx="3" ry="3.5" fill="#1e1b4b" />
        <ellipse cx="57" cy="45" rx="3" ry="3.5" fill="#1e1b4b" />
        <circle cx="44" cy="44" r="1.2" fill="#ffffff" />
        <circle cx="58" cy="44" r="1.2" fill="#ffffff" />
        <circle cx="42" cy="46" r="0.6" fill="#a5f3fc" />
        <circle cx="56" cy="46" r="0.6" fill="#a5f3fc" />

        {/* Cute Eyebrows */}
        <path d="M40 39 Q44 38 47 40" stroke="#581c87" strokeWidth="1.5" strokeLinecap="round" fill="none" />
        <path d="M53 40 Q56 38 60 39" stroke="#581c87" strokeWidth="1.5" strokeLinecap="round" fill="none" />

        {/* Blush */}
        <ellipse cx="38" cy="51" rx="3" ry="1.8" fill="#f43f5e" fillOpacity="0.45" />
        <ellipse cx="62" cy="51" rx="3" ry="1.8" fill="#f43f5e" fillOpacity="0.45" />

        {/* Cheerful Smile */}
        <path d="M46 54 Q50 58 54 54" stroke="#9333ea" strokeWidth="1.8" strokeLinecap="round" fill="none" />

        {/* Badge */}
        <g transform="translate(68, 12)">
          <circle cx="10" cy="10" r="10" fill="#06b6d4" />
          <path d="M6 10 C6 7.8 7.8 6 10 6 C12.2 6 14 7.8 14 10 V14 H12 V11 H8 V14 H6 Z" fill="#ffffff" />
        </g>
      </svg>
    ),
  },
  {
    id: 'char_amir',
    nameFa: 'امیرعلی (ورزشکار و پویا)',
    nameEn: 'Amirali (Athletic)',
    titleFa: 'فرزند پسر، ورزشکار و پرانرژی',
    titleEn: 'Dynamic & Sporty',
    tag: 'child',
    accentColor: '#10b981',
    gradientBg: 'from-emerald-600 via-teal-600 to-cyan-500',
    badgeEmoji: '⚡',
    descriptionFa: 'پر از انرژی، فوتبال، بازی و آموزش پس‌انداز پول توجیبی با کارت بانکی',
    renderSvg: ({ className = 'w-full h-full', size } = {}) => (
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        width={size}
        height={size}
      >
        <defs>
          <linearGradient id="gm_amir_bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#059669" />
            <stop offset="50%" stopColor="#0d9488" />
            <stop offset="100%" stopColor="#0284c7" />
          </linearGradient>
        </defs>

        <circle cx="50" cy="50" r="48" fill="url(#gm_amir_bg)" />
        <circle cx="50" cy="50" r="44" stroke="white" strokeOpacity="0.25" strokeWidth="1.5" />

        {/* Sport T-Shirt */}
        <path d="M22 95 C26 77, 37 72, 50 72 C63 72, 74 77, 78 95 Z" fill="#065f46" />
        <path d="M43 72 Q50 79 57 72 Z" fill="#a7f3d0" />
        {/* Sport stripe */}
        <line x1="28" y1="95" x2="35" y2="78" stroke="#34d399" strokeWidth="2.5" />
        <line x1="72" y1="95" x2="65" y2="78" stroke="#34d399" strokeWidth="2.5" />

        {/* Neck */}
        <rect x="45" y="58" width="10" height="11" rx="3" fill="#fed7aa" />

        {/* Face */}
        <ellipse cx="50" cy="46" rx="16" ry="18" fill="#fed7aa" />

        {/* Ears */}
        <circle cx="33" cy="47" r="3.5" fill="#fed7aa" />
        <circle cx="67" cy="47" r="3.5" fill="#fed7aa" />

        {/* Sporty Backwards Cap */}
        <path d="M32 37 C33 24, 67 24, 68 37 Z" fill="#0f172a" />
        <path d="M28 36 Q50 31 72 36 Q50 34 28 36 Z" fill="#0284c7" stroke="#38bdf8" strokeWidth="1" />
        <path d="M44 26 L56 26 L58 30 L42 30 Z" fill="#38bdf8" />

        {/* Side Burn / Hair Tuft */}
        <path d="M33 37 Q36 43 35 46 Q33 42 33 37 Z" fill="#1e293b" />
        <path d="M67 37 Q64 43 65 46 Q67 42 67 37 Z" fill="#1e293b" />

        {/* Sparkly Eyes */}
        <circle cx="43" cy="45" r="2.8" fill="#0f172a" />
        <circle cx="57" cy="45" r="2.8" fill="#0f172a" />
        <circle cx="44" cy="44" r="1" fill="#ffffff" />
        <circle cx="58" cy="44" r="1" fill="#ffffff" />

        {/* Brows */}
        <path d="M39 39 Q44 38 46 41" stroke="#0f172a" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M54 41 Q56 38 61 39" stroke="#0f172a" strokeWidth="1.8" strokeLinecap="round" />

        {/* Cheerful Grin with small tooth highlight */}
        <path d="M43 53 Q50 60 57 53 Z" fill="#b91c1c" />
        <path d="M45 53.5 Q50 55 55 53.5" stroke="#ffffff" strokeWidth="1.5" fill="none" />

        {/* Badge */}
        <g transform="translate(68, 12)">
          <circle cx="10" cy="10" r="10" fill="#f59e0b" />
          <path d="M11 5 L7 11 L10 11 L9 15 L14 9 L11 9 Z" fill="#ffffff" />
        </g>
      </svg>
    ),
  },
  {
    id: 'char_father',
    nameFa: 'پدر بزرگوار (بزرگ خاندان)',
    nameEn: 'The Patriarch',
    titleFa: 'بزرگ خانواده و مشاور باتجربه',
    titleEn: 'Patriarch & Senior Advisor',
    tag: 'parent',
    accentColor: '#f59e0b',
    gradientBg: 'from-amber-700 via-orange-600 to-yellow-500',
    badgeEmoji: '🎖️',
    descriptionFa: 'تجربه و درایت در مدیریت دارایی‌ها، املاک و پس‌اندازهای باارزش',
    renderSvg: ({ className = 'w-full h-full', size } = {}) => (
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        width={size}
        height={size}
      >
        <defs>
          <linearGradient id="gm_pat_bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#b45309" />
            <stop offset="50%" stopColor="#d97706" />
            <stop offset="100%" stopColor="#eab308" />
          </linearGradient>
        </defs>

        <circle cx="50" cy="50" r="48" fill="url(#gm_pat_bg)" />
        <circle cx="50" cy="50" r="44" stroke="white" strokeOpacity="0.25" strokeWidth="1.5" />

        {/* Warm Cardigan */}
        <path d="M20 95 C24 74, 35 69, 50 69 C65 69, 76 74, 80 95 Z" fill="#78350f" />
        <path d="M42 69 L50 82 L58 69 Z" fill="#fef3c7" />

        {/* Neck */}
        <rect x="44" y="56" width="12" height="13" rx="4" fill="#fed7aa" />

        {/* Head */}
        <ellipse cx="50" cy="45" rx="17.5" ry="20" fill="#fed7aa" />

        {/* Silver Hair / Temples */}
        <path d="M32 40 C31 27, 42 22, 50 22 C58 22, 69 27, 68 40 C63 33, 56 31, 50 31 C43 31, 37 34, 32 40 Z" fill="#94a3b8" />
        <path d="M31 38 C29 46, 31 52, 33 55 C34 50, 33 44, 31 38 Z" fill="#cbd5e1" />
        <path d="M69 38 C71 46, 69 52, 67 55 C66 50, 67 44, 69 38 Z" fill="#cbd5e1" />

        {/* Dignified Silver Moustache & Beard */}
        <path d="M40 54 Q50 51 60 54 Q57 63 50 65 Q43 63 40 54 Z" fill="#e2e8f0" />
        <path d="M43 53 Q50 56 57 53 Q50 57 43 53 Z" fill="#cbd5e1" />

        {/* Classic Glasses */}
        <rect x="36" y="41" width="11" height="7" rx="3" stroke="#b45309" strokeWidth="1.6" fill="white" fillOpacity="0.25" />
        <rect x="53" y="41" width="11" height="7" rx="3" stroke="#b45309" strokeWidth="1.6" fill="white" fillOpacity="0.25" />
        <line x1="47" y1="44" x2="53" y2="44" stroke="#b45309" strokeWidth="1.6" />

        {/* Eyes & Smile lines */}
        <circle cx="41.5" cy="44.5" r="1.5" fill="#451a03" />
        <circle cx="58.5" cy="44.5" r="1.5" fill="#451a03" />
        <path d="M33 44 Q35 45 33 47" stroke="#d97706" strokeWidth="1" strokeLinecap="round" />
        <path d="M67 44 Q65 45 67 47" stroke="#d97706" strokeWidth="1" strokeLinecap="round" />

        {/* Eyebrows */}
        <path d="M37 38 Q42 36 46 38" stroke="#cbd5e1" strokeWidth="2.2" strokeLinecap="round" />
        <path d="M54 38 Q58 36 63 38" stroke="#cbd5e1" strokeWidth="2.2" strokeLinecap="round" />

        {/* Badge */}
        <g transform="translate(68, 12)">
          <circle cx="10" cy="10" r="10" fill="#f59e0b" />
          <polygon points="10,4 12,8 17,9 13,13 14,17 10,15 6,17 7,13 3,9 8,8" fill="#ffffff" />
        </g>
      </svg>
    ),
  },
  {
    id: 'char_mother',
    nameFa: 'مادر مهربان (بانوی پرمهر)',
    nameEn: 'The Matriarch',
    titleFa: 'بزرگ خانواده، صبور و باتدبیر',
    titleEn: 'Matriarch & Guardian',
    tag: 'parent',
    accentColor: '#f97316',
    gradientBg: 'from-orange-500 via-rose-500 to-amber-300',
    badgeEmoji: '🌸',
    descriptionFa: 'نگهدارنده آرامش و گرمای خانه، با برکت در دخل‌وخرج',
    renderSvg: ({ className = 'w-full h-full', size } = {}) => (
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        width={size}
        height={size}
      >
        <circle cx="50" cy="50" r="48" fill="#ea580c" />
        <circle cx="50" cy="50" r="44" stroke="white" strokeOpacity="0.25" strokeWidth="1.5" />

        {/* Scarf / Chador / Elegant shawl */}
        <path d="M22 95 C24 70, 34 65, 50 65 C66 65, 76 70, 78 95 Z" fill="#9f1239" />
        <path d="M30 40 C28 65, 34 78, 50 78 C66 78, 72 65, 70 40 C70 26, 62 20, 50 20 C38 20, 30 26, 30 40 Z" fill="#be123c" />

        {/* Face */}
        <ellipse cx="50" cy="46" rx="15" ry="18" fill="#fde68a" />

        {/* Silver Hair Peak */}
        <path d="M42 32 Q50 30 58 32 Q50 35 42 32 Z" fill="#e2e8f0" />

        {/* Kind Eyes */}
        <ellipse cx="44" cy="45" rx="2" ry="2.5" fill="#4c0519" />
        <ellipse cx="56" cy="45" rx="2" ry="2.5" fill="#4c0519" />
        <circle cx="44.5" cy="44" r="0.8" fill="#ffffff" />
        <circle cx="56.5" cy="44" r="0.8" fill="#ffffff" />

        {/* Warm smile */}
        <path d="M45 54 Q50 58 55 54" stroke="#9f1239" strokeWidth="1.8" strokeLinecap="round" fill="none" />

        {/* Cheeks */}
        <circle cx="40" cy="50" r="2.5" fill="#fda4af" fillOpacity="0.5" />
        <circle cx="60" cy="50" r="2.5" fill="#fda4af" fillOpacity="0.5" />

        {/* Badge */}
        <g transform="translate(68, 12)">
          <circle cx="10" cy="10" r="10" fill="#f43f5e" />
          <circle cx="10" cy="10" r="5" fill="#ffffff" />
        </g>
      </svg>
    ),
  },
  {
    id: 'char_child_boy',
    nameFa: 'کودک پس‌اندازکننده (شازده)',
    nameEn: 'Little Saver Boy',
    titleFa: 'فرزند کوچک، پس‌اندازکننده قلک',
    titleEn: 'Junior Saver & Learner',
    tag: 'child',
    accentColor: '#0ea5e9',
    gradientBg: 'from-sky-500 via-blue-500 to-indigo-600',
    badgeEmoji: '🪙',
    descriptionFa: 'یادگیری مدیریت پول، قلک هوشمند و اهداف خرید اسباب‌بازی',
    renderSvg: ({ className = 'w-full h-full', size } = {}) => (
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        width={size}
        height={size}
      >
        <circle cx="50" cy="50" r="48" fill="#0284c7" />
        <circle cx="50" cy="50" r="44" stroke="white" strokeOpacity="0.25" strokeWidth="1.5" />

        {/* Cute Overalls */}
        <path d="M24 95 C28 78, 38 74, 50 74 C62 74, 72 78, 76 95 Z" fill="#0369a1" />
        <rect x="42" y="74" width="16" height="15" rx="3" fill="#38bdf8" />
        <circle cx="45" cy="78" r="1.5" fill="#ffffff" />
        <circle cx="55" cy="78" r="1.5" fill="#ffffff" />

        {/* Head */}
        <circle cx="50" cy="48" r="18" fill="#fed7aa" />

        {/* Playful Brown Hair with Cowlick */}
        <path d="M32 44 C31 30, 42 24, 50 24 C60 24, 69 30, 68 44 C63 36, 56 34, 50 34 C43 34, 37 38, 32 44 Z" fill="#78350f" />
        <path d="M50 24 Q53 17 56 20 Q53 23 50 24 Z" fill="#78350f" />

        {/* Big Curious Eyes */}
        <circle cx="43" cy="48" r="3.5" fill="#0f172a" />
        <circle cx="57" cy="48" r="3.5" fill="#0f172a" />
        <circle cx="44" cy="46.5" r="1.5" fill="#ffffff" />
        <circle cx="58" cy="46.5" r="1.5" fill="#ffffff" />

        {/* Big Smile */}
        <path d="M43 55 Q50 63 57 55 Z" fill="#e11d48" />

        {/* Cute Round Cheeks */}
        <circle cx="38" cy="53" r="3" fill="#f43f5e" fillOpacity="0.4" />
        <circle cx="62" cy="53" r="3" fill="#f43f5e" fillOpacity="0.4" />

        {/* Gold Coin Badge */}
        <g transform="translate(68, 12)">
          <circle cx="10" cy="10" r="10" fill="#f59e0b" />
          <circle cx="10" cy="10" r="7" stroke="#ffffff" strokeWidth="1" fill="#fbbf24" />
          <text x="10" y="13" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#78350f">﷼</text>
        </g>
      </svg>
    ),
  },
  {
    id: 'char_child_girl',
    nameFa: 'پرنسس کوچک (دختر شاداب)',
    nameEn: 'Little Princess',
    titleFa: 'فرزند کوچک، باانگیزه و شاداب',
    titleEn: 'Junior Princess & Joy',
    tag: 'child',
    accentColor: '#f43f5e',
    gradientBg: 'from-pink-500 via-rose-400 to-amber-300',
    badgeEmoji: '⭐',
    descriptionFa: 'رویاپرداز، هدف‌گذاری برای کتاب داستان، کلاس نقاشی و هنر',
    renderSvg: ({ className = 'w-full h-full', size } = {}) => (
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        width={size}
        height={size}
      >
        <circle cx="50" cy="50" r="48" fill="#e11d48" />
        <circle cx="50" cy="50" r="44" stroke="white" strokeOpacity="0.25" strokeWidth="1.5" />

        {/* Twin Pigtails */}
        <circle cx="26" cy="40" r="8" fill="#451a03" />
        <circle cx="74" cy="40" r="8" fill="#451a03" />
        <circle cx="28" cy="42" r="3" fill="#f43f5e" />
        <circle cx="72" cy="42" r="3" fill="#f43f5e" />

        {/* Cute Dress */}
        <path d="M24 95 C28 78, 38 74, 50 74 C62 74, 72 78, 76 95 Z" fill="#fb7185" />
        <path d="M44 74 L50 82 L56 74 Z" fill="#ffffff" />

        {/* Head */}
        <circle cx="50" cy="48" r="17" fill="#fed7aa" />

        {/* Front Hair */}
        <path d="M34 42 C33 30, 43 25, 50 25 C58 25, 67 30, 66 42 C61 35, 54 34, 50 34 C44 34, 38 37, 34 42 Z" fill="#451a03" />

        {/* Eyes */}
        <circle cx="43" cy="47" r="3" fill="#1e1b4b" />
        <circle cx="57" cy="47" r="3" fill="#1e1b4b" />
        <circle cx="44" cy="46" r="1.2" fill="#ffffff" />
        <circle cx="58" cy="46" r="1.2" fill="#ffffff" />

        {/* Joyful Smile */}
        <path d="M45 54 Q50 60 55 54" stroke="#be123c" strokeWidth="2" strokeLinecap="round" fill="none" />

        {/* Blush */}
        <circle cx="39" cy="52" r="3" fill="#fda4af" />
        <circle cx="61" cy="52" r="3" fill="#fda4af" />

        {/* Badge */}
        <g transform="translate(68, 12)">
          <circle cx="10" cy="10" r="10" fill="#f59e0b" />
          <polygon points="10,4 12,8 17,9 13,13 14,17 10,15 6,17 7,13 3,9 8,8" fill="#ffffff" />
        </g>
      </svg>
    ),
  },
  {
    id: 'char_investor',
    nameFa: 'سرمایه‌گذار (تحلیل‌گر طلا و رمزارز)',
    nameEn: 'Smart Investor',
    titleFa: 'متخصص بازار سرمایه، طلا و رمزارز',
    titleEn: 'Wealth & Crypto Investor',
    tag: 'pro',
    accentColor: '#10b981',
    gradientBg: 'from-emerald-700 via-teal-600 to-amber-500',
    badgeEmoji: '📈',
    descriptionFa: 'متمرکز بر رشد دارایی‌های خانواده، خرید پله‌ای طلا و صندوق‌های درآمد ثابت',
    renderSvg: ({ className = 'w-full h-full', size } = {}) => (
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        width={size}
        height={size}
      >
        <circle cx="50" cy="50" r="48" fill="#047857" />
        <circle cx="50" cy="50" r="44" stroke="white" strokeOpacity="0.25" strokeWidth="1.5" />

        {/* Dark Modern Coat */}
        <path d="M20 95 C24 74, 35 68, 50 68 C65 68, 76 74, 80 95 Z" fill="#064e3b" />
        <path d="M42 68 L50 82 L58 68 Z" fill="#10b981" />
        <line x1="50" y1="82" x2="50" y2="95" stroke="#34d399" strokeWidth="2" />

        {/* Face */}
        <ellipse cx="50" cy="46" rx="17" ry="19.5" fill="#fed7aa" />

        {/* Neat Hair with Golden Highlight */}
        <path d="M33 41 C31 28, 42 22, 50 22 C61 22, 69 28, 67 41 C62 33, 55 31, 50 31 C43 31, 37 34, 33 41 Z" fill="#1e293b" />
        <path d="M50 22 Q58 24 64 29 Q56 26 50 22 Z" fill="#f59e0b" />

        {/* Stylish Modern Beard */}
        <path d="M35 48 C37 60, 44 65, 50 65 C56 65, 63 60, 65 48 C63 56, 56 61, 50 61 C44 61, 37 56, 35 48 Z" fill="#1e293b" />

        {/* Futuristic Cyber Visor / Glasses */}
        <rect x="34" y="41" width="32" height="7" rx="3" fill="#10b981" fillOpacity="0.3" stroke="#34d399" strokeWidth="1.6" />
        <circle cx="42" cy="44.5" r="1.5" fill="#ffffff" />
        <circle cx="58" cy="44.5" r="1.5" fill="#ffffff" />

        {/* Confident Smile */}
        <path d="M45 54 Q50 57 55 54" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" fill="none" />

        {/* Badge */}
        <g transform="translate(68, 12)">
          <circle cx="10" cy="10" r="10" fill="#10b981" />
          <path d="M6 14 L9 10 L12 12 L15 7" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          <polyline points="13,7 15,7 15,9" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </g>
      </svg>
    ),
  },
  {
    id: 'char_tech',
    nameFa: 'نخبه فناوری (توسعه‌دهنده هوشمند)',
    nameEn: 'Tech Visionary',
    titleFa: 'برنامه‌نویس، تحلیل داده و آینده‌نگر',
    titleEn: 'Developer & AI Specialist',
    tag: 'pro',
    accentColor: '#06b6d4',
    gradientBg: 'from-cyan-600 via-blue-600 to-indigo-700',
    badgeEmoji: '💻',
    descriptionFa: 'بهینه‌سازی مخارج با هوش مصنوعی و نمودارهای تحلیلی عمیق',
    renderSvg: ({ className = 'w-full h-full', size } = {}) => (
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        width={size}
        height={size}
      >
        <circle cx="50" cy="50" r="48" fill="#0891b2" />
        <circle cx="50" cy="50" r="44" stroke="white" strokeOpacity="0.25" strokeWidth="1.5" />

        {/* Cyber Hoodie */}
        <path d="M22 95 C25 76, 36 70, 50 70 C64 70, 75 76, 78 95 Z" fill="#0f172a" />
        <path d="M42 70 L50 82 L58 70 Z" fill="#06b6d4" />

        {/* Face */}
        <ellipse cx="50" cy="46" rx="16.5" ry="19" fill="#fde68a" />

        {/* Neon Hairstyle */}
        <path d="M33 42 C30 27, 43 21, 50 21 C62 21, 69 27, 67 42 C62 31, 53 29, 49 29 C42 29, 36 34, 33 42 Z" fill="#1e1b4b" />
        <path d="M40 23 Q50 18 56 22" stroke="#22d3ee" strokeWidth="2.5" strokeLinecap="round" />

        {/* Modern Round Glasses with Blue Light Reflect */}
        <circle cx="42" cy="45" r="5" stroke="#0891b2" strokeWidth="1.6" fill="#06b6d4" fillOpacity="0.25" />
        <circle cx="58" cy="45" r="5" stroke="#0891b2" strokeWidth="1.6" fill="#06b6d4" fillOpacity="0.25" />
        <line x1="47" y1="45" x2="53" y2="45" stroke="#0891b2" strokeWidth="1.6" />

        <circle cx="42" cy="45" r="1.5" fill="#0f172a" />
        <circle cx="58" cy="45" r="1.5" fill="#0f172a" />

        {/* Grin */}
        <path d="M45 55 Q50 59 55 55" stroke="#0284c7" strokeWidth="1.8" strokeLinecap="round" fill="none" />

        {/* Badge */}
        <g transform="translate(68, 12)">
          <circle cx="10" cy="10" r="10" fill="#0284c7" />
          <path d="M6 9 L9 6 L9 14 L6 11 Z" fill="#ffffff" />
          <path d="M14 9 L11 6 L11 14 L14 11 Z" fill="#ffffff" />
        </g>
      </svg>
    ),
  },
  {
    id: 'char_doctor',
    nameFa: 'پزشک (سلامت و مراقبت خانواده)',
    nameEn: 'Family Doctor',
    titleFa: 'متخصص سلامت و بهداشت خانواده',
    titleEn: 'Doctor & Wellness Guide',
    tag: 'pro',
    accentColor: '#14b8a6',
    gradientBg: 'from-teal-600 via-emerald-600 to-cyan-500',
    badgeEmoji: '🩺',
    descriptionFa: 'مدیریت هزینه‌های پزشکی، درمانی، بیمه تکمیلی و سلامت اعضا',
    renderSvg: ({ className = 'w-full h-full', size } = {}) => (
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        width={size}
        height={size}
      >
        <circle cx="50" cy="50" r="48" fill="#0d9488" />
        <circle cx="50" cy="50" r="44" stroke="white" strokeOpacity="0.25" strokeWidth="1.5" />

        {/* Medical Coat */}
        <path d="M22 95 C25 76, 36 70, 50 70 C64 70, 75 76, 78 95 Z" fill="#ffffff" />
        <path d="M45 70 L50 82 L55 70 Z" fill="#14b8a6" />

        {/* Stethoscope */}
        <path d="M35 72 C35 84, 65 84, 65 72" stroke="#334155" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        <circle cx="50" cy="86" r="3" fill="#cbd5e1" stroke="#334155" strokeWidth="1" />

        {/* Face */}
        <ellipse cx="50" cy="46" rx="16.5" ry="19" fill="#fed7aa" />

        {/* Hair */}
        <path d="M33 42 C30 27, 43 21, 50 21 C62 21, 69 27, 67 42 C62 31, 53 29, 49 29 C42 29, 36 34, 33 42 Z" fill="#334155" />

        {/* Eyes */}
        <circle cx="43" cy="45" r="2.2" fill="#0f172a" />
        <circle cx="57" cy="45" r="2.2" fill="#0f172a" />
        <circle cx="44" cy="44" r="0.8" fill="#ffffff" />
        <circle cx="58" cy="44" r="0.8" fill="#ffffff" />

        {/* Reassuring Smile */}
        <path d="M44 54 Q50 58 56 54" stroke="#0f766e" strokeWidth="1.8" strokeLinecap="round" fill="none" />

        {/* Badge */}
        <g transform="translate(68, 12)">
          <circle cx="10" cy="10" r="10" fill="#ef4444" />
          <rect x="8.5" y="4" width="3" height="12" rx="1" fill="#ffffff" />
          <rect x="4" y="8.5" width="12" height="3" rx="1" fill="#ffffff" />
        </g>
      </svg>
    ),
  },
  {
    id: 'char_artist',
    nameFa: 'هنرمند (طراح و ایده‌پرداز)',
    nameEn: 'Creative Designer',
    titleFa: 'ایده‌پرداز، طراح و نوآور',
    titleEn: 'Artist & Creative Spirit',
    tag: 'pro',
    accentColor: '#8b5cf6',
    gradientBg: 'from-violet-600 via-fuchsia-500 to-rose-400',
    badgeEmoji: '🎨',
    descriptionFa: 'خلق تجربیات نو، ارتقای روحیه خانواده و خرید ابزارهای خلاقانه',
    renderSvg: ({ className = 'w-full h-full', size } = {}) => (
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        width={size}
        height={size}
      >
        <circle cx="50" cy="50" r="48" fill="#7c3aed" />
        <circle cx="50" cy="50" r="44" stroke="white" strokeOpacity="0.25" strokeWidth="1.5" />

        {/* Vibrant Pullover */}
        <path d="M22 95 C25 76, 36 70, 50 70 C64 70, 75 76, 78 95 Z" fill="#4c1d95" />
        <circle cx="34" cy="85" r="3" fill="#f43f5e" />
        <circle cx="46" cy="88" r="2.5" fill="#f59e0b" />
        <circle cx="64" cy="84" r="3" fill="#06b6d4" />

        {/* Face */}
        <ellipse cx="50" cy="46" rx="16" ry="19" fill="#fed7aa" />

        {/* Artist Beret */}
        <ellipse cx="50" cy="30" rx="20" ry="9" fill="#be185d" transform="rotate(-10 50 30)" />
        <circle cx="50" cy="21" r="2" fill="#be185d" />

        {/* Hair */}
        <path d="M33 42 C35 34, 40 31, 50 31 C60 31, 65 34, 67 42 C64 48, 60 54, 58 56 C54 52, 46 52, 42 56 C40 54, 36 48, 33 42 Z" fill="#312e81" />

        {/* Eyes with sparkle */}
        <circle cx="43" cy="45" r="2.5" fill="#1e1b4b" />
        <circle cx="57" cy="45" r="2.5" fill="#1e1b4b" />
        <circle cx="44" cy="44" r="1" fill="#ffffff" />
        <circle cx="58" cy="44" r="1" fill="#ffffff" />

        {/* Cheek heart tattoo/paint */}
        <path d="M38 52 C37 51, 35 52, 35 53 C35 55, 38 56, 38 56 C38 56, 41 55, 41 53 C41 52, 39 51, 38 52 Z" fill="#ec4899" />

        {/* Warm smile */}
        <path d="M45 54 Q50 58 55 54" stroke="#a21caf" strokeWidth="1.8" strokeLinecap="round" fill="none" />

        {/* Badge */}
        <g transform="translate(68, 12)">
          <circle cx="10" cy="10" r="10" fill="#a855f7" />
          <ellipse cx="10" cy="10" rx="6" ry="4" fill="#ffffff" />
          <circle cx="8" cy="9" r="1" fill="#ef4444" />
          <circle cx="11" cy="8" r="1" fill="#3b82f6" />
          <circle cx="12" cy="11" r="1" fill="#eab308" />
        </g>
      </svg>
    ),
  },
];

// Mapping map from legacy emojis or partial IDs to our Graphic Characters
const EMOJI_TO_CHARACTER_MAP: Record<string, string> = {
  '👨‍💼': 'char_masoud',
  '👨': 'char_masoud',
  '👑': 'char_masoud',
  '👩': 'char_maryam',
  '👩‍💼': 'char_maryam',
  '👧': 'char_sara',
  '👩‍🎓': 'char_sara',
  '👦': 'char_amir',
  '🧑‍🦱': 'char_amir',
  '🧓': 'char_father',
  '👴': 'char_father',
  '👵': 'char_mother',
  '👶': 'char_child_boy',
  '👱‍♀️': 'char_child_girl',
  '🧔': 'char_investor',
  '🧑': 'char_tech',
  '👨‍💻': 'char_tech',
  '👩‍⚕️': 'char_doctor',
  '👨‍⚕️': 'char_doctor',
  '🎨': 'char_artist',
};

export function getGraphicCharacter(idOrEmoji?: string): GraphicCharacter {
  if (!idOrEmoji) return GRAPHIC_CHARACTERS[0];

  // Direct ID match
  const direct = GRAPHIC_CHARACTERS.find(c => c.id === idOrEmoji);
  if (direct) return direct;

  // Legacy emoji or alias match
  const mappedId = EMOJI_TO_CHARACTER_MAP[idOrEmoji];
  if (mappedId) {
    const found = GRAPHIC_CHARACTERS.find(c => c.id === mappedId);
    if (found) return found;
  }

  // Fallback match based on name or tag
  return GRAPHIC_CHARACTERS[0];
}

export function isGraphicCharacterId(id?: string): boolean {
  if (!id) return false;
  return GRAPHIC_CHARACTERS.some(c => c.id === id);
}
