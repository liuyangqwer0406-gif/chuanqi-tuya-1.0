export type ProjectImage = {
  src: string;
  alt: string;
  caption: string;
  note: string;
  shape?: "wide" | "portrait" | "board";
};

export type ProjectChapter = {
  title: string;
  titleCn: string;
  body: string;
  images: ProjectImage[];
};

export type ProjectMotionPoster = {
  src: string;
  poster: string;
  alt: string;
  caption: string;
  note: string;
  placement: "lead" | "portrait" | "stack";
};

export type ProjectMotionSection = {
  title: string;
  titleCn: string;
  body: string;
  posters: ProjectMotionPoster[];
};

export type SynthesisProject = {
  slug: string;
  title: string;
  titleCn?: string;
  discipline: string;
  year: string;
  role: string;
  scope: string;
  status: string;
  intro: string;
  introCn: string;
  cover: ProjectImage;
  motion?: ProjectMotionSection;
  chapters: ProjectChapter[];
  closing: string;
  closingCn: string;
};

import { assetPath } from "@/lib/assets";

const image = (
  src: string,
  alt: string,
  caption: string,
  note: string,
  shape?: ProjectImage["shape"],
): ProjectImage => ({ src: assetPath(`portfolio-assets/${src}`), alt, caption, note, shape });

const motionPoster = (
  src: string,
  alt: string,
  caption: string,
  placement: ProjectMotionPoster["placement"],
): ProjectMotionPoster => ({
  src: assetPath(`portfolio-assets/dad/motion/${src}.mp4`),
  poster: assetPath(`portfolio-assets/dad/motion/${src}-poster.jpg`),
  alt,
  caption,
  note: "Digital motion study / 10 sec loop",
  placement,
});

export const synthesisProjects: SynthesisProject[] = [
  {
    slug: "roku-ikition",
    title: "ROKU IKITION",
    titleCn: "六味无酒精植物饮",
    discipline: "Brand Identity / Packaging / 3D Space",
    year: "2025",
    role: "Visual Identity / Packaging / 3D Environment",
    scope: "D&AD New Blood Brief / Four-person Concept Team",
    status: "Official Submission / Campus Selection",
    intro: "A unified identity and packaging system for six Japanese botanical flavours, developed for D&AD New Blood across typography, bottle labels, 3D scenes and posters.",
    introCn: "D&AD New Blood 竞赛命题。我和三位同学定了概念和六种草本风味；随后由我单独完成全套字标、瓶体包装、三维场景渲染以及户外海报。重点是用同一套排版网格，把六种风味既区分开又归拢在一起。",
    cover: image("dad-cover.jpg", "ROKU IKITION 品牌主视觉与无酒精饮品瓶体", "Identity overview", "D&AD New Blood brief"),
    motion: {
      title: "MOTION POSTER STUDIES.",
      titleCn: "让瓶体、材质与版式进入十秒循环。",
      body: "Four short loops test the bottle silhouette under rotating lights, metallic textures and editorial grids. Motion is used here to test how the label behaves, not just to look fancy.",
      posters: [
        motionPoster("kinetic-sculpture", "银灰色 ROKU IKITION 瓶体在技术网格与线框结构中旋转", "01 / Kinetic sculpture", "lead"),
        motionPoster("green-industrial", "绿色 ROKU IKITION 瓶体在黑色工业海报版式中旋转", "02 / Acid industrialism", "portrait"),
        motionPoster("holographic-surface", "镭射材质 ROKU IKITION 瓶体与环形结构旋转", "03 / Holographic surface", "stack"),
        motionPoster("metallic-legacy", "金属质感 ROKU IKITION 瓶体悬浮在米白编辑版式中", "04 / Metallic legacy", "stack"),
      ],
    },
    chapters: [
      {
        title: "ONE SYSTEM, SIX FLAVOURS.",
        titleCn: "六种风味，放在同一套网格里。",
        body: "The logo and typographic grid stay consistent; discrete color accents identify shiso, yuzu, sansho, gyokuro, sencha and sakura without breaking family unity.",
        images: [
          image("dad-packaging.jpg", "ROKU IKITION 六种植物风味包装系统", "Packaging system", "Graphic design"),
          image("dad-3d.jpg", "ROKU IKITION 瓶体与森林水景三维渲染", "Product environment", "3D modelling / Render"),
          image("dad-outdoor.jpg", "ROKU IKITION 户外广告应用", "Outdoor communication", "Campaign extension"),
        ],
      },
      {
        title: "MATERIAL CHANGES. THE MARK HOLDS.",
        titleCn: "换个光线和场景，瓶子依然能认出来。",
        body: "Testing the bottle in water, stone and low-key studio rooms to make sure the label and silhouette stay readable before calling it done.",
        images: [
          image("dad/product-studio.jpg", "浅色背景中的 ROKU IKITION 产品渲染", "Studio bottle", "Product render"),
          image("dad/material-teal.jpg", "青绿色矿石环境中的 ROKU IKITION 瓶体", "Mineral / teal", "Material study"),
          image("dad/material-ember.jpg", "暖橙色矿石环境中的 ROKU IKITION 瓶体", "Mineral / ember", "Material study"),
          image("dad/product-water.jpg", "水面与台座上的 ROKU IKITION 瓶体", "Water / form", "Product atmosphere", "portrait"),
        ],
      },
    ],
    closing: "The proposal was submitted to D&AD New Blood and selected through the campus round. It is an academic design proposal rather than a commercial product.",
    closingCn: "项目完成了从共同策略到完整视觉系统的推演；这是学生竞赛提案，没有进入实际商业量产。",
  },
  {
    slug: "packaging-design",
    title: "PACKAGING DESIGN",
    titleCn: "商业包装设计",
    discipline: "Commercial Packaging / Pre-press Production",
    year: "2026",
    role: "Packaging System / Multilingual Layout / Pre-press Production",
    scope: "10+ Product Lines / Amazon EU/US · Action Retail",
    status: "Mass Produced & Shelf Listed",
    intro: "Commercial retail packaging across 10+ home textile product lines for Amazon and Action, built under tight deadlines to survive multilingual text, barcodes and factory production.",
    introCn: "实习期间做的海外商超零售包装。前后做了 10 多套产品线，大多在 2 到 3 天内经过两三轮修改定稿并送印。工作核心是在多语言说明、条码规范和刀线约束下，把信息层级排整齐、不出印前差错。",
    cover: image("packaging-cover.jpg", "海外零售毛毯产品场景与包装视觉", "Commercial work", "Packaging / Production"),
    chapters: [
      {
        title: "DESIGN THAT REACHES THE SHELF.",
        titleCn: "在 2-3 天内做完，还要经得起印刷机与货架检验。",
        body: "Typical packaging went through 2 or 3 revisions in 2 to 3 days. The real work was keeping the text hierarchy clear while producing exact multilingual artwork, die-lines and care labels.",
        images: [
          image("packaging-mockup.jpg", "酒红色毛毯成品包装与纸质腰封", "Teddy blanket", "Finished package"),
          image("packaging-artwork.jpg", "毛毯腰封多语言印前展开稿与出血线", "Blanket sleeve", "Multilingual artwork"),
          image("packaging-care-label.jpg", "多色毛毯洗标与认证标签印前文件", "Care label system", "Five colour variants"),
          image("packaging-blanket/blanket-01-hero.webp", "LUNEA HOME 柔软泰迪毛毯电商主图海报", "Soft Teddy Blanket", "Hero visual / E-commerce", "board"),
          image("packaging-blanket/blanket-02-benefits.webp", "LUNEA HOME 羊羔绒毛毯核心卖点与四维特性", "Core benefits", "Product highlights", "board"),
          image("packaging-blanket/blanket-03-material.webp", "LUNEA HOME 织物触感、包边细节与悬垂质感", "Material details", "Texture, finish & drape", "board"),
          image("packaging-blanket/blanket-04-colours.webp", "LUNEA HOME 六款流行色系陈列矩阵（燕麦/象牙白/灰褐/驼色/鼠尾绿/烟粉）", "Available colors", "Soft tones for every interior", "board"),
          image("packaging-blanket/blanket-05-sizeguide.webp", "LUNEA HOME 毛毯尺寸规格与版型匹配指南", "Size guide", "Choose the best fit", "board"),
          image("packaging-bear-tag.jpg", "多语言毛绒玩具吊牌正背面与刀线", "Bear hang tag", "Front / back artwork"),
        ],
      },
      {
        title: "FROM ARTWORK TO USE CONTEXT.",
        titleCn: "平面稿排好后，放进真实的使用场景里看看。",
        body: "Testing packaging flats on retail display racks and living room environments. AI-assisted visuals are labelled as concept mockups to stay honest about what is factory photo and what is simulation.",
        images: [
          image("packaging-source/sofa-cover-display.jpg", "沙发套系列包装与落地展示架尺寸方案", "Sofa cover display", "Production artwork"),
          image("packaging-application/sofa-cover-floor-display-v1.png", "沙发套包装落地陈列架应用样机", "Retail placement", "AI-assisted application visualisation"),
          image("packaging-source/kids-bath-mat-system.jpg", "儿童浴室地垫吊牌洗标与色彩系统", "Kids bath mat", "Tag / label / colour system"),
          image("packaging-application/kids-bath-mat-lifestyle-v1.png", "儿童浴室地垫应用样机", "Bathroom context", "AI-assisted application visualisation"),
          image("packaging-evidence/4K_floor_display_mockup_1786978159024.jpg", "家居产品落地陈列架公开展示样机", "Floor display", "Public presentation mockup"),
        ],
      },
    ],
    closing: "Accuracy, file versioning and readable labels were the main design deliverables. Sensitive client data and commercial codes have been removed.",
    closingCn: "从印前文件到实体货架，不出错、把信息排清楚本身就是设计结果；已隐去客户地址、真实条码和内部型号。",
  },
  {
    slug: "runes",
    title: "RUNES ATTACK AND DEFENSE",
    titleCn: "符文攻防战",
    discipline: "Esports Event Identity / Spatial Wayfinding",
    year: "2026",
    role: "Concept / Identity / Art Direction / Spatial Graphics",
    scope: "Individual graduation project",
    status: "Graduation project",
    intro: "A graduation identity for an esports event, built on red-blue faction tension and five rune icons, running across posters, arena wayfinding, tickets and apparel.",
    introCn: "毕业设计。用红蓝两色区分战队阵营，设计了五套代表不同赛事信息的符文图形；再把这套符号从海报延展到场馆导视路牌、入场手环和周边衣服上。",
    cover: image("thesis-cover.jpg", "符文攻防战红蓝阵营活动主视觉", "Key visual", "Graduation project"),
    chapters: [
      {
        title: "THE POSTER IS ONLY THE START.",
        titleCn: "海报做完，观众还得能认阵营、找对路。",
        body: "Faction colours show who you're rooting for; rune icons show what kind of notice you're looking at. Together they keep the arena legible without adding visual clutter.",
        images: [
          image("thesis-identity.jpg", "符文攻防战色彩与识别系统", "Faction identity", "Colour / Type"),
          image("thesis-icons.jpg", "符文攻防战符文图标系统", "Rune language", "Five information families"),
          image("thesis-merch.jpg", "符文攻防战服装徽章与赛事周边", "Event merchandise", "Identity extension"),
        ],
      },
      {
        title: "ONE CODE, MANY SCALES.",
        titleCn: "一套图形规则，从小门票排到大外墙。",
        body: "Carrying the red-blue contrast and rune shapes onto tickets, arena pylons, digital boards and stage graphics so everything feels like part of one match day.",
        images: [
          image("thesis-outdoor.jpg", "符文攻防战户外广告应用", "Outdoor system", "Campaign scale"),
          image("thesis-wayfinding.jpg", "符文攻防战赛事空间导视应用", "Spatial wayfinding", "Arena navigation"),
          image("thesis-board-system.jpg", "符文攻防战导视与区域编码系统展板", "System board", "Defence presentation"),
          image("thesis-board-application.jpg", "符文攻防战活动应用主视觉", "Application board", "Defence presentation"),
        ],
      },
    ],
    closing: "Tested on digital boards and identity guidelines rather than an actual arena event.",
    closingCn: "毕业设计方案；整套系统通过展板和数字样机推演呈现，尚未在真实线下场馆中落地验证。",
  },
  {
    slug: "jiangkou",
    title: "JIANGKOU SUNKEN SILVER",
    titleCn: "江口沉银",
    discipline: "Cultural Visual / 3D Scene / Packaging",
    year: "2024",
    role: "Concept / 3D Modelling / Shaders / Packaging",
    scope: "Museum Cultural Competition Individual Proposal",
    status: "Competition Finalist (大赛入围)",
    intro: "A museum competition proposal using 3D artefact modelling, weathered silver textures and dark studio light to show the objects sinking, buried and rediscovered.",
    introCn: "眉山江口沉银博物馆文创大赛入围提案。我没有在文物表面硬贴古典花纹，而是按“沉没、发现、重见”的顺序做了银锭和器物的三维建模、水下金属材质与暗调布光，让人先把文物本身看清楚。",
    cover: image("jiangkou-cover-v2.jpg", "江口沉银器物三维视觉主画面", "Hero artefact", "Cultural visual / 3D"),
    chapters: [
      {
        title: "LET THE ARTEFACT SPEAK FIRST.",
        titleCn: "少做多余花纹，先把文物本身看真切。",
        body: "Instead of adding cliché decorative patterns, I used real historical proportions, oxidized silver shaders and harsh raking light to let the metal speak for itself.",
        images: [
          image("jiangkou-process-v2.jpg", "江口沉银的建模与创作过程", "Model process", "Form / Material / Light"),
          image("jiangkou-renders-v2.jpg", "江口沉银器物使用场景三维渲染", "Discovery sequence", "3D scene study"),
          image("jiangkou-cover-v2.jpg", "江口沉银主视觉器物渲染", "Key visual", "Competition proposal"),
        ],
      },
    ],
    closing: "Finalist in the 2024 Meishan Jiangkou Sunken Silver Museum Competition. A digital concept proposal; no physical merchandise was produced.",
    closingCn: "入围 2024 眉山江口沉银博物馆文创设计大赛；目前成果为数字提案，未制作实体商品。",
  },
  {
    slug: "reverie",
    title: "REVERIE",
    titleCn: "坠入梦境",
    discipline: "Immersive Web Experience / Creative Direction",
    year: "2026",
    role: "Original Concept / Creative Direction / Content Architecture",
    scope: "WebGL / Content Architecture / Responsive Web",
    status: "AI-Assisted Build / Experimental Case Study",
    intro: "An experimental WebGL web project featuring a foggy forest entrance, an archival reading index, and subtle parallax, exploring how a website can feel more like an environment than a feed.",
    introCn: "一个自己搭着玩的 WebGL 实验网页。做了一个雾气弥漫的树林入口和一套手稿索引目录，在双语阅读里穿插轻微视差。主要是想试试除了千篇一律的卡片瀑布流，网页还能怎么让人静下来读东西。",
    cover: image("reverie-cover.jpg", "REVERIE 沉浸式网页体验封面", "Portal", "Original direction / AI-assisted build"),
    chapters: [
      {
        title: "ONE SCENE. ONE READING TASK.",
        titleCn: "一个场景，一个安静读东西的角落。",
        body: "Using volumetric mist, warm light and dark tones to build a calm environment so people read longer articles without rushing to scroll past.",
        images: [
          image("reverie-case/immersions.jpg", "雾林与暖灯构成的 REVERIE 场景", "Immersions", "Atmosphere / Entry"),
          image("reverie-case/forest.jpg", "森林中的暖灯入口", "Forest portal", "WebGL scene"),
          image("reverie-case/codex.jpg", "烛光地图与档案手稿场景", "Codex", "Reading world"),
          image("reverie-case/atelier.jpg", "暖光中的铜器工坊", "Atelier", "Object world"),
        ],
      },
      {
        title: "A WORLD STILL NEEDS AN INDEX.",
        titleCn: "再有氛围，也得有个好找东西的目录。",
        body: "The archive anchors poetic scenes into a usable index: titles, categories and clean mobile order make sure people don't get lost in the fog.",
        images: [
          image("reverie-case/card-hollow.jpg", "空之合唱森林场景", "Hollow choir", "World index"),
          image("reverie-case/card-tide.jpg", "潮汐图谱洞穴场景", "Tide atlas", "World index"),
          image("reverie-worlds.jpg", "REVERIE Worlds 桌面端完整界面", "Desktop archive", "Content architecture"),
          image("reverie-mobile.jpg", "REVERIE 移动端完整界面", "Mobile portal", "Responsive order", "portrait"),
        ],
      },
    ],
    closing: "Live as an experimental case study. Full disclosure: the original direction was mine, and code implementation was assisted by AI tools.",
    closingCn: "创意与版面结构由我提出，前端借助 AI 工具辅助写完；保留透明标注，供交互同好探讨。",
  },
  {
    slug: "melonpop",
    title: "MELO DEW",
    titleCn: "瓜露",
    discipline: "Beverage Brand Identity / Retail Touchpoints",
    year: "2026",
    role: "Brand Strategy / Visual Direction / Packaging",
    scope: "Brand Identity / Packaging / Retail Kiosk / E-Commerce",
    status: "Personal Concept Exploration",
    intro: "A concept drink brand turning a watermelon slice and a water drop into a repeatable mark across cans, cartons, digital shop screens and pop-up retail carts.",
    introCn: "个人概念练习。把一片西瓜切片和一滴水组合成主标，用西瓜红、果皮绿与米白搭配。试着把这个小图形铺到易拉罐、利乐包、外带杯、手机商城甚至路边摊亭子上，看它在实际应用里耐不耐看。",
    cover: image("melonpop/melo-dew-brand-overview.png", "MELO DEW 瓜露品牌总览与西瓜汁包装应用", "Brand overview", "Personal concept / AI-assisted visualisation", "board"),
    chapters: [
      {
        title: "A SLICE BECOMES A SYSTEM.",
        titleCn: "一片西瓜切片，做成整套标志。",
        body: "Horizontal and stacked lockups, simple geometry, watermelon-red and rind-green palettes turn a simple slice idea into a brand that can be printed on anything.",
        images: [
          image("melonpop/melo-dew-logo-system.png", "MELO DEW 瓜露标志组合、反白版本与使用规范", "Logo system", "Lockups / Symbol / Usage", "board"),
          image("melonpop/melo-dew-color-type.png", "MELO DEW 瓜露色彩、字体层级与图形母题", "Colour & typography", "Palette / Type / Motifs", "board"),
        ],
      },
      {
        title: "THE IDENTITY ENTERS DAILY USE.",
        titleCn: "把标志印到罐子、外带杯和手机屏幕上。",
        body: "Testing how the logo looks on cans, bottles, takeout cups, stationery and digital shopping carts to make sure it actually works in real life.",
        images: [
          image("melonpop/melo-dew-packaging.png", "MELO DEW 瓜露瓶、罐、纸盒与外带杯包装系统", "Packaging system", "AI-assisted application visualisation", "board"),
          image("melonpop/melo-dew-stationery.png", "MELO DEW 瓜露信纸、名片、贴纸、吊牌与手提袋应用", "Stationery & applications", "AI-assisted application visualisation", "board"),
          image("melonpop/melo-dew-digital.png", "MELO DEW 瓜露桌面电商、移动购物与邮件视觉", "Digital commerce", "AI-assisted application visualisation", "board"),
        ],
      },
      {
        title: "FROM SHELF TO CAMPAIGN.",
        titleCn: "走到户外，搭个小亭子试试效果。",
        body: "Mocking up retail kiosks, cold drink fridges and roadside billboard posters to see if the colors pop from twenty meters away.",
        images: [
          image("melonpop/melo-dew-retail.png", "MELO DEW 瓜露零售亭、菜单、冷柜与外带系统", "Retail & point of sale", "AI-assisted application visualisation", "board"),
          image("melonpop/melo-dew-campaign.png", "MELO DEW 瓜露社交传播与果汁产品视觉板", "Campaign direction", "AI-assisted application visualisation", "board"),
        ],
      },
    ],
    closing: "Personal concept exploration. Visuals are mockups to show brand consistency; there is no operating shop or manufactured beverage.",
    closingCn: "个人练习项目；图示均为概念效果图，无真实开店运营或实体饮料售卖。",
  },
  {
    slug: "vitrolume",
    title: "VITROLUME",
    titleCn: "珀光",
    discipline: "Premium Glassware Identity / Form & Packaging",
    year: "2025-2026",
    role: "Brand Direction / Vessel Form / Packaging Architecture",
    scope: "Identity / Glassware Forms / Gift Box Packaging",
    status: "Personal Concept Exploration",
    intro: "A glassware brand concept built without decorative noise, letting glass refraction, amber highlights and sharp contrast define the posters, three cups and a gift box.",
    introCn: "玻璃杯品牌概念方案。核心思路是不做花哨图形，全靠黑白高反差底色、玻璃折射出来的线条和一点点琥珀微光来撑场面。以此设计了三款杯型、一个对杯礼盒和海报。",
    cover: image("vitrolume/glass-hero.png", "VitroLume 高端玻璃杯品牌主视觉", "Glassware study", "Personal concept"),
    chapters: [
      {
        title: "LIGHT IS THE IDENTITY.",
        titleCn: "让光照透杯子，品牌自己就显出来了。",
        body: "Using sharp black-and-white contrast and glass reflections so the design doesn't need extra logos cluttering the surface.",
        images: [
          image("vitrolume-posters.jpg", "VitroLume 品牌字标与折射海报系统", "Poster system", "Identity / Refraction"),
          image("vitrolume-applications.jpg", "VitroLume 手提袋应用研究", "Early application", "Graphic extension"),
        ],
      },
      {
        title: "FORM, GIFT, DISPLAY.",
        titleCn: "杯型、礼盒和陈列，用同一种切面语言。",
        body: "Designing three glass shapes and a two-cup gift box to see if the faceted geometry holds together in physical proportions.",
        images: [
          image("vitrolume/gift-set.png", "VitroLume 双杯硬质礼盒概念", "Double-glass gift set", "AI-assisted visualisation"),
          image("vitrolume/product-family.png", "VitroLume 三种玻璃饮具家族", "Glassware family", "Tumbler / Highball / Goblet"),
          image("vitrolume/lifestyle.png", "VitroLume 暮色吧台使用场景", "Drinking scene", "AI-assisted visualisation"),
          image("vitrolume/retail-display.png", "VitroLume 精品店陈列概念", "Retail display", "AI-assisted visualisation"),
        ],
      },
    ],
    closing: "Concept study exploring glass physics and packaging. Physical moulds and drop tests remain for future development.",
    closingCn: "视觉和材质已推演成型；后续如果有机会，会做实物开模和抗摔打样测试。",
  },
];

export function getSynthesisProject(slug: string) {
  return synthesisProjects.find((project) => project.slug === slug);
}
