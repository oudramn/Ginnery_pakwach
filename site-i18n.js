(() => {
  const localeTags = { en: 'en', fr: 'fr', ar: 'ar', zh: 'zh-Hans', ko: 'ko-KR', hi: 'hi-IN' };
  let activeLocale = '';
  const rows = [
    ['Skip to content','Aller au contenu','تخطَّ إلى المحتوى','跳转到正文','본문으로 건너뛰기','मुख्य सामग्री पर जाएँ'],
    ['Home','Accueil','الرئيسية','首页','홈','मुखपृष्ठ'],['Explore','Explorer','استكشف','探索','둘러보기','देखें'],
    ['Stay','Séjour','الإقامة','住宿','숙박','ठहरें'],['Dine','Dîner','تناول الطعام','餐饮','식사','भोजन'],
    ['Dine & Bar','Restaurant et bar','المطعم والبار','餐厅与酒吧','다이닝 & 바','भोजन और बार'],
    ['Dining','Restaurant','المطعم','餐饮','다이닝','रेस्तराँ'],['Events','Événements','الفعاليات','活动','이벤트','कार्यक्रम'],
    ['The story','Notre histoire','قصتنا','品牌故事','호텔 이야기','हमारी कहानी'],
    ['Book / Enquire ↗','Réserver / demander ↗','احجز / استفسر ↗','预订 / 咨询 ↗','예약 / 문의 ↗','बुक करें / पूछताछ ↗'],
    ['Book / enquire ↗','Réserver / demander ↗','احجز / استفسر ↗','预订 / 咨询 ↗','예약 / 문의 ↗','बुक करें / पूछताछ ↗'],
    ['Menu +','Menu +','القائمة +','菜单 +','메뉴 +','मेनू +'],['Menu','Menu','القائمة','菜单','메뉴','मेनू'],
    ['Rooms','Chambres','الغرف','客房','객실','कमरे'],['Activities','Activités','الأنشطة','活动体验','액티비티','गतिविधियाँ'],
    ['The place','Le lieu','المكان','酒店与周边','공간','यह जगह'],['Journal','Journal','المجلة','酒店日志','저널','डायरी'],
    ['Offers','Offres','العروض','优惠','혜택','ऑफ़र'],['People','Équipe','الأشخاص','团队','사람들','लोग'],
    ['Location','Emplacement','الموقع','位置','위치','स्थान'],['Gallery','Galerie','معرض الصور','画廊','갤러리','गैलरी'],
    ['FAQs','FAQ','الأسئلة الشائعة','常见问题','자주 묻는 질문','अक्सर पूछे जाने वाले प्रश्न'],
    ['A different kind of arrival','Une autre façon d’arriver','وصول بطابع مختلف','不一样的抵达体验','새로운 방식의 도착','आगमन का एक अलग अंदाज़'],
    ['Stay a little','Séjournez un peu','أقم قليلًا','多停留一会儿','조금 더 머물며','थोड़ा और ठहरें'],
    ['closer to','au plus près de','اقترب أكثر من','更靠近','더 가까이','और करीब'],['wonder.','l’émerveillement.','الدهشة.','惊喜。','경이로움.','आश्चर्य के'],
    ['A gracious welcome, a slower rhythm and the distinctive beauty of Uganda. Make space for a stay that feels entirely your own.','Un accueil attentionné, un rythme plus lent et la beauté singulière de l’Ouganda. Prenez le temps d’un séjour qui vous ressemble.','ترحيب كريم وإيقاع أهدأ وجمال أوغندا المميز. امنح نفسك إقامة تعبّر عنك.','以热情款待、舒缓节奏与乌干达独特之美，开启专属于您的旅程。','따뜻한 환대와 여유로운 리듬, 우간다만의 아름다움을 느껴보세요. 나다운 휴식을 위한 시간을 마련하세요.','स्नेहपूर्ण स्वागत, धीमी रफ़्तार और युगांडा की अनूठी सुंदरता। अपने मनपसंद ठहराव के लिए समय निकालें।'],
    ['Discover your stay','Découvrir votre séjour','اكتشف إقامتك','探索住宿','숙박 알아보기','अपने ठहराव को जानें'],['Dine with us','Dînez avec nous','تناول الطعام معنا','与我们共进美食','함께 식사하기','हमारे साथ भोजन करें'],
    ['A sense of place · Northern Uganda','L’esprit du lieu · Nord de l’Ouganda','روح المكان · شمال أوغندا','地域风情 · 乌干达北部','장소의 분위기 · 우간다 북부','स्थान का एहसास · उत्तरी युगांडा'],
    ['Scroll to discover','Faites défiler pour découvrir','مرّر لاكتشاف المزيد','向下滚动，继续探索','스크롤하여 둘러보세요','देखने के लिए स्क्रॉल करें'],
    ['A world of welcome','Un monde d’hospitalité','عالم من الترحيب','宾至如归的世界','환대가 있는 세상','आतिथ्य की एक दुनिया'],
    ['Grand in feeling.','Une grandeur ressentie.','فخامة تُشعَر.','气度不凡。','품격을 느끼다.','भव्य एहसास。'],['Grounded in place.','Ancré dans son lieu.','متجذّر في المكان.','扎根于此。','장소에 뿌리내리다.','अपनी जगह से जुड़ा。'],
    ['Inspired by the warm spectacle of Dubai, the quiet refinement of Paris, the easy light of Spain and the timeless character of England, The Ginnery brings its own Ugandan point of view to every arrival.','Inspiré par l’éclat chaleureux de Dubaï, le raffinement discret de Paris, la lumière d’Espagne et le caractère intemporel de l’Angleterre, The Ginnery accueille chaque visite avec sa propre sensibilité ougandaise.','مستوحى من روعة دبي الدافئة ورقي باريس الهادئ وضوء إسبانيا السلس وطابع إنجلترا الخالد، يقدّم ذا جينري رؤيته الأوغندية الخاصة لكل وصول.','汲取迪拜的热情气度、巴黎的含蓄精致、西班牙的明朗光线与英格兰的恒久风格，The Ginnery 以独特的乌干达视角迎接每一位宾客。','두바이의 따뜻한 화려함, 파리의 절제된 세련미, 스페인의 편안한 빛, 영국의 시대를 초월한 분위기에서 영감을 얻어 The Ginnery만의 우간다식 환대를 전합니다.','दुबई की गर्मजोशी, पेरिस की सादगी, स्पेन की खुली रोशनी और इंग्लैंड की कालातीत पहचान से प्रेरित The Ginnery हर आगमन को अपना विशिष्ट युगांडाई दृष्टिकोण देता है。'],
    ['Natural textures, thoughtful service and a sense of ease let the landscape take the lead. The result is a stay with a distinct sense of place and an international spirit.','Les matières naturelles, un service attentionné et une atmosphère paisible laissent le paysage s’exprimer. Il en résulte un séjour ancré dans son lieu et ouvert sur le monde.','تدع الخامات الطبيعية والخدمة المدروسة وأجواء الراحة للمشهد الطبيعي أن يتصدر التجربة؛ لإقامة متجذرة في المكان ومنفتحة على العالم.','天然质感、周到服务与自在氛围，让自然景致成为主角，带来兼具地域特色与国际气息的住宿体验。','자연스러운 질감과 세심한 서비스, 편안한 분위기가 풍경을 주인공으로 만듭니다. 이곳만의 감각과 국제적인 분위기가 어우러진 휴식을 경험하세요.','प्राकृतिक बनावट, विचारशील सेवा और सहज माहौल को प्रकृति को आगे रखने दें। यहाँ का ठहराव अपनी जगह से जुड़ा और अंतरराष्ट्रीय भावना से भरा है।'],
    ['Discover the experience','Découvrir l’expérience','اكتشف التجربة','探索体验','경험 둘러보기','अनुभव जानें'],
    ['The luxury of slowing down','Le luxe de ralentir','رفاهية التمهّل','慢下来的奢享','느림의 여유','धीमा होने का सुख'],['Time, made room for.','Le temps retrouve sa place.','للمتعة متّسع من الوقت.','为时光留白。','시간을 위한 여유.','समय के लिए जगह।'],
    ['The art of feeling at ease','L’art de se sentir bien','فن الشعور بالراحة','自在之道','편안함의 미학','सुकून महसूस करने की कला'],
    ['The world inspires.','Le monde inspire.','العالم مصدر إلهام.','世界给予灵感。','세상이 영감을 줍니다.','दुनिया से प्रेरणा।'],['Uganda makes it ours.','L’Ouganda y apporte sa touche.','وأوغندا تضفي طابعها.','乌干达赋予其独特气息。','우간다가 우리만의 감성을 더합니다.','युगांडा इसे अपना बनाता है।'],
    ['A meeting of moods and materials, brought together by a generous welcome and the feeling of being somewhere special.','Un dialogue de matières et d’ambiances, uni par un accueil généreux et le sentiment d’être dans un lieu à part.','تلتقي الأجواء والخامات في ترحيب كريم وشعور بأنك في مكان استثنائي.','不同氛围与材质相遇，在热情款待中汇成一段特别的旅程。','다양한 분위기와 소재가 따뜻한 환대와 어우러져 특별한 장소의 감각을 만듭니다.','अलग-अलग रंग और बनावट आत्मीय स्वागत में मिलते हैं, जिससे खास जगह पर होने का एहसास मिलता है।'],
    ['Arrive in','Arrivez avec','استقبل','以优雅方式','품격 있게','शानदार अंदाज़ में'],['grand style.','élégance.','بأناقة.','从容抵达。','도착하세요.','आएँ।'],
    ['Confident scale, a warm glow and a sense of occasion from the very first moment.','Une ampleur affirmée, une lumière chaleureuse et un sentiment d’exception dès le premier instant.','رحابة ودفء وإحساس بالمناسبة المميزة منذ اللحظة الأولى.','开阔气度、温暖光影，从第一刻便有仪式感。','넉넉한 공간과 따뜻한 빛, 첫 순간부터 느껴지는 특별함.','खुलापन, गर्माहट और पहले ही पल से खास होने का एहसास।'],
    ['Beauty in','La beauté dans','الجمال في','美藏于','아름다움은','खूबसूरती'],['the details.','les détails.','التفاصيل.','细节之中。','디테일에 있습니다.','विवरणों में।'],
    ['Parisian restraint meets the relaxed elegance of Spanish light, texture and outdoor living.','La retenue parisienne rencontre l’élégance décontractée de l’Espagne, entre lumière, matières et vie au grand air.','يلتقي هدوء باريس بأناقة إسبانيا المريحة وضوئها وخاماتها وحياتها في الهواء الطلق.','巴黎的克制优雅，遇见西班牙阳光、质感与户外生活的自在。','파리의 절제미가 스페인의 빛과 질감, 여유로운 야외 생활과 어우러집니다.','पेरिस की सादगी स्पेन की रोशनी, बनावट और खुले वातावरण की सहज सुंदरता से मिलती है。'],
    ['Timeless, with','Intemporel, avec','خالدة، مع','历久弥新，','시대를 넘어,','कालातीत,'],['a sense of place.','un ancrage local.','بروح المكان.','且扎根于此。','장소의 감각과 함께.','जगह की पहचान के साथ।'],
    ['A welcome that travels well','Une hospitalité qui vous accompagne','ترحيب يرافق رحلتك','一路相伴的欢迎','여행 내내 이어지는 환대','सफ़र के साथ चलने वाला स्वागत'],
    ['From local moments','Des moments d’ici','من لحظات محلية','从本地时光','현지의 순간부터','स्थानीय पलों से'],['to','aux','إلى','到','먼 여정까지','तक'],['faraway journeys.','voyages lointains.','رحلات بعيدة.','远方旅程。','먼 여정까지.','दूर की यात्राओं तक।'],
    ["Whether you're planning a meal, a celebration, a business gathering or a longer visit, start with the experience you have in mind.",'Que vous prépariez un repas, une célébration, une rencontre professionnelle ou un long séjour, commencez par l’expérience qui vous ressemble.','سواء كنت تخطط لوجبة أو احتفال أو لقاء عمل أو إقامة أطول، ابدأ بالتجربة التي تتمناها.','无论是用餐、庆祝、商务聚会还是长住，都可从心仪的体验开始规划。','식사, 기념일, 비즈니스 모임, 장기 투숙 등 원하는 경험부터 계획을 시작해 보세요.','भोजन, उत्सव, व्यावसायिक मुलाक़ात या लंबा ठहराव—जिस अनुभव की कल्पना है, वहीं से शुरुआत करें。'],
    ['For Uganda and the region','Pour l’Ouganda et la région','لأوغندا والمنطقة','适合乌干达及周边宾客','우간다와 인근 지역 고객을 위해','युगांडा और क्षेत्र के लिए'],['Make a day of it.','Profitez pleinement de la journée.','اجعل يومك مميزًا.','享受完整的一天。','하루를 알차게 보내세요.','दिन को यादगार बनाएँ।'],
    ['Explore restaurant and bar requests, weekend stays, private celebrations, business lunches and event enquiries. Quote currency can be requested in UGX.','Découvrez les demandes de restaurant et de bar, les séjours de week-end, les célébrations privées, les déjeuners d’affaires et les événements. Le devis peut être demandé en UGX.','استكشف طلبات المطعم والبار وإقامات نهاية الأسبوع والاحتفالات الخاصة ووجبات العمل والفعاليات. يمكن طلب عرض السعر بالشلن الأوغندي.','可咨询餐厅、酒吧、周末住宿、私人庆祝、商务午餐及活动，并可要求以 UGX 报价。','레스토랑과 바, 주말 숙박, 프라이빗 축하 행사, 비즈니스 점심과 이벤트를 문의하세요. UGX 견적을 요청할 수 있습니다.','रेस्तराँ, बार, सप्ताहांत ठहराव, निजी समारोह, व्यावसायिक दोपहर के भोजन और कार्यक्रमों के बारे में पूछें。 UGX में मूल्य माँग सकते हैं。'],
    ['Plan a local experience','Planifier une expérience locale','خطط لتجربة محلية','规划本地体验','현지 경험 계획하기','स्थानीय अनुभव की योजना'],
    ['For international travellers','Pour les voyageurs internationaux','للمسافرين الدوليين','适合国际旅客','해외 여행객을 위해','अंतरराष्ट्रीय यात्रियों के लिए'],['Plan the whole journey.','Planifiez tout le voyage.','خطط للرحلة كاملة.','规划完整旅程。','여행 전체를 계획하세요.','पूरी यात्रा की योजना बनाएँ।'],
    ['Request accommodation, ask about airport transfers, share arrival details and request a quote in UGX or USD. Availability and all arrangements are confirmed by the hotel.','Demandez un hébergement, un transfert depuis l’aéroport, indiquez votre arrivée et demandez un devis en UGX ou USD. L’hôtel confirmera les disponibilités et modalités.','اطلب الإقامة أو النقل من المطار، وشارك تفاصيل الوصول واطلب عرض سعر بالشلن الأوغندي أو الدولار. يؤكد الفندق التوافر والترتيبات.','可咨询住宿与机场接送，提供抵达信息，并要求以 UGX 或 USD 报价。酒店将确认空房与安排。','숙소와 공항 이동을 문의하고 도착 정보를 공유해 UGX 또는 USD 견적을 요청하세요. 이용 가능 여부와 모든 일정은 호텔이 확인합니다.','ठहरने और हवाई अड्डे से आने की व्यवस्था पूछें, आगमन जानकारी दें और UGX या USD में मूल्य माँगें。 उपलब्धता व व्यवस्थाएँ होटल पुष्टि करेगा。'],
    ['Plan an arrival','Préparer votre arrivée','خطط لوصولك','规划抵达安排','도착 계획하기','आगमन की योजना'],
    ['Travel with clarity.','Voyagez sereinement.','سافر بوضوح وطمأنينة.','安心规划旅程。','명확하게 여행을 준비하세요.','निश्चिंत होकर यात्रा करें।'],
    ['Official Uganda visa information, airport information and directions are collected in one place for trip planning.','Les informations officielles sur les visas, l’aéroport et les itinéraires sont réunies ici pour préparer votre voyage.','تجد هنا معلومات التأشيرة الرسمية والمطار والاتجاهات لتخطيط رحلتك.','签证、机场与路线的官方信息汇集于此，方便规划行程。','여행 계획을 위해 공식 비자 및 공항 정보와 길 안내를 한곳에 모았습니다.','यात्रा की तैयारी के लिए आधिकारिक वीज़ा, हवाई अड्डे और रास्ते की जानकारी यहाँ एक जगह है।'],
    ['Ask for what you need.','Demandez ce dont vous avez besoin.','اطلب ما تحتاج إليه.','按需提出请求。','필요한 것을 요청하세요.','अपनी ज़रूरत बताएँ।'],
    ['Request transport, meal preferences, occasion arrangements or event quotations in one guided form.','Demandez un transport, précisez vos préférences de repas, organisez une occasion ou demandez un devis événementiel via un formulaire guidé.','اطلب النقل أو تفضيلات الوجبات أو ترتيبات المناسبة أو عروض الفعاليات عبر نموذج واحد.','通过一份简单表单，咨询交通、餐饮偏好、庆祝安排或活动报价。','교통, 식사 취향, 기념일 준비, 이벤트 견적을 한 번에 문의하세요.','एक ही निर्देशित फ़ॉर्म में परिवहन, भोजन पसंद, समारोह और कार्यक्रम का मूल्य पूछें।'],
    ['One joined-up journey.','Un parcours tout en simplicité.','رحلة مترابطة.','一站式旅程。','하나로 이어지는 여정.','एक सहज यात्रा।'],
    ['Send a request and the hotel team will confirm availability, pricing and arrangements with you.','Envoyez une demande ; l’équipe de l’hôtel vous confirmera la disponibilité, les tarifs et les modalités.','أرسل طلبًا وسيؤكد فريق الفندق التوافر والأسعار والترتيبات.','提交请求后，酒店团队将与您确认空房、价格及安排。','요청을 보내면 호텔 팀이 이용 가능 여부와 가격, 일정을 확인해 드립니다.','अनुरोध भेजें; होटल टीम उपलब्धता, मूल्य और व्यवस्था की पुष्टि करेगी।'],
    ['A journey in three chapters','Un voyage en trois chapitres','رحلة في ثلاثة فصول','三段旅程','세 장으로 만나는 여정','तीन अध्यायों की यात्रा'],
    ['An experience','Une expérience','تجربة','一段体验','경험','एक अनुभव'],['shaped by','façonnée par','تصوغها','由……塑造','이 만드는','से आकार लेती'],['the details.','les détails.','التفاصيل.','细节。','디테일.','है विवरण。'],
    ['Scroll to discover the stay, the table and the landscape.','Faites défiler pour découvrir le séjour, la table et le paysage.','مرّر لاكتشاف الإقامة والمائدة والطبيعة.','向下探索住宿、餐桌与风景。','스크롤하여 숙박, 식탁, 풍경을 만나보세요.','ठहराव, भोजन और प्रकृति देखने के लिए स्क्रॉल करें।'],
    ['Chapter 01 / The stay','Chapitre 01 / Le séjour','الفصل 01 / الإقامة','第一章 / 住宿','챕터 01 / 숙박','अध्याय 01 / ठहराव'],
    ['Arrive.','Arriver.','صِل.','抵达。','도착.','आइए।'],['Exhale.','Respirer.','تنفّس.','舒展身心。','숨을 고르세요.','सुकून लें।'],
    ['Make room for a calmer pace, considered comfort and the small details that make a place feel personal.','Retrouvez un rythme plus doux, un confort réfléchi et ces détails qui rendent un lieu personnel.','اترك مساحة لإيقاع أهدأ وراحة مدروسة وتفاصيل صغيرة تمنح المكان طابعًا شخصيًا.','留出空间，享受舒缓节奏、贴心舒适与让旅程更个人化的细节。','여유로운 리듬과 세심한 편안함, 공간을 특별하게 만드는 작은 디테일을 느껴보세요.','धीमी रफ़्तार, सोच-समझकर दिया गया आराम और जगह को अपना बनाने वाले छोटे विवरणों के लिए समय रखें。'],
    ['Chapter 02 / The table','Chapitre 02 / La table','الفصل 02 / المائدة','第二章 / 餐桌','챕터 02 / 식탁','अध्याय 02 / भोजन'],
    ['Gather.','Se retrouver.','اجتمع.','相聚。','함께 모여요.','मिलें।'],['Savour.','Savourez.','استمتع بالمذاق.','细细品味。','음미하세요.','स्वाद लें।'],
    ['Let food, conversation and the pleasure of being present become part of the story.','Faites du repas, des échanges et du plaisir d’être ensemble une partie de votre histoire.','اجعل الطعام والحديث ومتعة الحضور جزءًا من الحكاية.','让美食、交谈与当下的愉悦成为旅程的一部分。','음식과 대화, 함께하는 순간의 즐거움을 여행의 이야기로 만드세요.','भोजन, बातचीत और साथ होने की खुशी को कहानी का हिस्सा बनने दें。'],
    ['Chapter 03 / The landscape','Chapitre 03 / Le paysage','الفصل 03 / الطبيعة','第三章 / 风景','챕터 03 / 풍경','अध्याय 03 / प्रकृति'],
    ['Look closer.','Regardez de plus près.','تأمّل عن قرب.','细看身边。','가까이 들여다보세요.','गौर से देखें।'],['Feel more.','Ressentez davantage.','اشعر بالمزيد.','感受更多。','더 깊이 느껴보세요.','और गहराई से महसूस करें।'],
    ["Let the region's real character, nature and people shape an experience no template could recreate.",'Laissez le caractère authentique de la région, sa nature et ses habitants créer une expérience unique.','دع طابع المنطقة الحقيقي وطبيعتها وأهلها يصوغ تجربة لا تشبه غيرها.','让当地真实的风貌、自然与人们，塑造无法复制的体验。','지역의 진짜 매력과 자연, 사람들이 어떤 틀로도 재현할 수 없는 경험을 만듭니다.','क्षेत्र का असली स्वभाव, प्रकृति और लोग ऐसा अनुभव बनाएँ जिसे कोई साँचा दोहरा न सके。'],
    ['The stay','Le séjour','الإقامة','住宿','숙박','ठहराव'],['The table','La table','المائدة','餐桌','식탁','भोजन'],['The landscape','Le paysage','الطبيعة','风景','풍경','प्रकृति'],
    ['Your time at The Ginnery','Votre séjour au Ginnery','وقتك في ذا جينري','在 The Ginnery 的时光','The Ginnery에서의 시간','The Ginnery में आपका समय'],
    ['Make the moment','Faites de l’instant','اجعل اللحظة','让此刻','순간을','पल को'],['your own.','le vôtre.','لحظتك.','属于自己。','나만의 것으로.','अपना बनाएँ।'],
    ['Find your own rhythm: settle into a stay, share a table or bring everyone together for a special occasion.','Trouvez votre rythme : séjournez, partagez un repas ou réunissez vos proches pour une occasion spéciale.','اعثر على إيقاعك: أقم في الفندق أو شارك مائدة أو اجمع الأحبة لمناسبة خاصة.','找到自己的节奏：入住、共享餐桌，或为特别时刻相聚。','나만의 리듬을 찾아보세요. 머물고, 식탁을 나누고, 특별한 날 함께 모이세요.','अपनी रफ़्तार चुनें—ठहरें, साथ भोजन करें या किसी ख़ास मौके पर सबको जुटाएँ।'],
    ['Space to settle','Un espace pour se poser','مساحة للاسترخاء','安顿身心的空间','편안히 머물 공간','सुकून से ठहरने की जगह'],
    ['Unpack, unwind and find a little more room in your day.','Défaites vos valises, détendez-vous et retrouvez du temps pour vous.','أفرغ أمتعتك واسترخِ واترك مساحة أكبر في يومك.','放下行李，放松身心，为一天多留一点余裕。','짐을 풀고, 긴장을 내려놓고, 하루에 여유를 더하세요.','सामान रखें, आराम करें और दिन में थोड़ा और समय पाएँ।'],
    ['Gather and savour','Se retrouver et savourer','اجتمع واستمتع','相聚品味','함께 즐기다','मिलें और आनंद लें'],
    ['Make time for good food, easy conversation and one more story.','Prenez le temps d’un bon repas, d’une conversation légère et d’une histoire de plus.','خصص وقتًا للطعام الطيب والحديث الهادئ وحكاية أخرى.','为美食、闲谈与又一个故事留出时间。','좋은 음식과 편안한 대화, 새로운 이야기를 위한 시간을 내세요.','अच्छे भोजन, सहज बातचीत और एक और कहानी के लिए समय निकालें।'],
    ['Rooted in Uganda','Ancré en Ouganda','متجذر في أوغندا','扎根乌干达','우간다에 뿌리내리다','युगांडा से जुड़ा'],
    ['Let the northern landscape and its unhurried pace set the scene.','Laissez les paysages du Nord et leur rythme paisible donner le ton.','دع طبيعة الشمال وإيقاعها الهادئ يرسمان المشهد.','让北部风光与从容节奏成为背景。','북부의 풍경과 느긋한 리듬이 장면을 채웁니다.','उत्तरी भू-दृश्य और उसकी धीमी रफ़्तार को माहौल बनाने दें।'],
    ['Your visit, your way.','Votre visite, à votre façon.','زيارتك بطريقتك.','以您喜欢的方式开启旅程。','당신만의 방식으로 머무세요.','आपकी यात्रा, आपके अंदाज़ में।'],
    ['Stay, dine, celebrate or plan a business gathering—send a request to begin.','Séjour, repas, célébration ou rencontre professionnelle : envoyez une demande pour commencer.','أقم أو تناول الطعام أو احتفل أو خطط للقاء عمل؛ أرسل طلبًا للبدء.','住宿、用餐、庆祝或商务聚会——提交请求即可开始规划。','숙박, 식사, 축하, 비즈니스 모임까지. 문의를 보내 계획을 시작하세요.','ठहरें, भोजन करें, उत्सव मनाएँ या व्यावसायिक बैठक रखें—शुरुआत के लिए अनुरोध भेजें。'],
    ['Open booking & enquiries','Ouvrir les réservations et demandes','افتح الحجوزات والاستفسارات','进入预订与咨询','예약 및 문의 열기','बुकिंग और पूछताछ खोलें'],
    ['A remarkable corner of Uganda','Un coin remarquable de l’Ouganda','ركن مميز من أوغندا','乌干达的非凡一隅','우간다의 특별한 공간','युगांडा का एक अनोखा कोना'],
    ['International in spirit.','Ouvert sur le monde.','بروح عالمية.','拥有国际气息。','세계적인 감각.','अंतरराष्ट्रीय सोच।'],['Rooted in the north.','Ancré dans le Nord.','ومتجذّر في الشمال.','扎根北部。','북부에 뿌리내리다.','उत्तर में जड़ें。'],
    ["From the moment you arrive, discover a warmer, more personal kind of hospitality. Here, the generous landscape and Uganda's unmistakable character are part of the experience.",'Dès votre arrivée, découvrez une hospitalité plus chaleureuse et personnelle. Les paysages généreux et le caractère singulier de l’Ouganda font partie du séjour.','منذ لحظة وصولك، اكتشف ضيافة أدفأ وأكثر شخصية؛ فالمشهد الواسع وطابع أوغندا الأصيل جزء من التجربة.','抵达之时，感受更温暖、更贴心的款待。开阔的风景与乌干达鲜明的个性，都是体验的一部分。','도착하는 순간부터 따뜻하고 개인적인 환대를 경험하세요. 풍요로운 풍경과 우간다만의 개성이 여정에 함께합니다.','आगमन से ही आत्मीय और व्यक्तिगत मेहमाननवाज़ी पाएँ। विशाल प्राकृतिक दृश्य और युगांडा की खास पहचान अनुभव का हिस्सा हैं。'],
    ['Come to slow down, spend time together and see Northern Uganda from a new perspective.','Venez ralentir, partager du temps et découvrir le Nord de l’Ouganda autrement.','تعالَ لتتمهل وتقضي وقتًا معًا وترى شمال أوغندا بمنظور جديد.','放慢脚步，共度时光，从新的视角认识乌干达北部。','속도를 늦추고 함께 시간을 보내며 새로운 시선으로 우간다 북부를 만나보세요.','धीमे पड़ें, साथ समय बिताएँ और उत्तरी युगांडा को नए नज़रिए से देखें।'],
    ['Begin planning your visit','Commencer à planifier votre visite','ابدأ التخطيط لزيارتك','开始规划行程','방문 계획 시작하기','अपनी यात्रा की योजना शुरू करें'],
    ['Your Northern Uganda story','Votre histoire dans le Nord de l’Ouganda','حكايتك في شمال أوغندا','您的乌干达北部故事','우간다 북부에서의 이야기','उत्तरी युगांडा की आपकी कहानी'],
    ['A different kind of','Une autre façon d’','نوع مختلف من','不一样的','새로운 방식의','एक अलग तरह का'],['arrival.','arriver.','الوصول.','抵达。','도착.','आगमन।'],
    ['Stay a little longer. Take the scenic route. Let us help you make the most of your time at The Ginnery.','Prolongez votre séjour. Prenez la route panoramique. Nous vous aidons à profiter pleinement du Ginnery.','أقم مدة أطول واسلك الطريق الأجمل. دعنا نساعدك على الاستمتاع بوقتك في ذا جينري.','多停留一会儿，走一段风景优美的路程。让我们帮您充分体验 The Ginnery。','조금 더 머물고 풍경 좋은 길을 따라오세요. The Ginnery에서의 시간을 더 알차게 만들어 드립니다.','थोड़ा और ठहरें, सुंदर रास्ता चुनें। The Ginnery में आपके समय को यादगार बनाने में हमें साथ दें।'],
    ['Plan your visit','Planifier votre visite','خطط لزيارتك','规划行程','방문 계획하기','अपनी यात्रा की योजना'],
    ['A closer look at The Ginnery','Un regard plus proche sur The Ginnery','نظرة أقرب على ذا جينري','近距离探索 The Ginnery','The Ginnery 더 가까이 보기','The Ginnery को करीब से देखें'],
    ['A place to','Un lieu pour','مكان لـ','一处可以','나만의 공간','एक जगह जहाँ'],['make your own.','vous sentir chez vous.','تجعله مكانك.','成为自己的天地。','나답게 머물 수 있는.','आप अपना बना सकते हैं।'],
    ['Discover a slower rhythm in Pakwach. Find a room, linger over the menu, gather for an occasion or make a little time to play.','Découvrez le rythme paisible de Pakwach. Trouvez une chambre, prenez le temps du menu, réunissez-vous ou jouez un peu.','اكتشف إيقاع باكواش الهادئ. اختر غرفة، واستمتع بالقائمة، واجتمع لمناسبة أو خصص وقتًا للعب.','在帕夸奇体验舒缓节奏。选一间客房，慢慢品味菜单，相聚庆祝，或留点时间玩乐。','파크와치의 여유로운 리듬을 느껴보세요. 객실을 둘러보고 메뉴를 즐기며 모임을 갖거나 잠시 놀아보세요.','पक्वाच की धीमी रफ़्तार महसूस करें। कमरा देखें, मेनू का आनंद लें, किसी मौके पर मिलें या खेल के लिए समय निकालें।'],
    ['Begin exploring','Commencer la visite','ابدأ الاستكشاف','开始探索','둘러보기 시작','देखना शुरू करें'],['Rooms & suites','Chambres et suites','الغرف والأجنحة','客房与套房','객실 & 스위트','कमरे और सुइट'],
    ['Rest,','Reposez-vous,','استرح،','好好休息，','편안히,','आराम से,'],['well.','vraiment.','بهدوء.','尽享惬意。','충분히.','सुकून से।'],
    ['Make yourself at home. Browse the rooms and current rates, then send a stay request for the hotel team to confirm.','Installez-vous. Découvrez les chambres et tarifs actuels, puis envoyez une demande de séjour à confirmer par l’hôtel.','اشعر كأنك في بيتك. تصفح الغرف والأسعار الحالية ثم أرسل طلب إقامة ليؤكده فريق الفندق.','自在如家。浏览客房与当前价格，再提交住宿请求，由酒店团队确认。','내 집처럼 편안하게. 객실과 현재 요금을 살펴본 뒤 호텔에 숙박 요청을 보내 확인받으세요.','घर जैसा आराम पाएँ। कमरे और मौजूदा दरें देखें, फिर होटल से पुष्टि के लिए ठहरने का अनुरोध भेजें।'],
    ['Ask about a stay ↗','Demander un séjour ↗','استفسر عن الإقامة ↗','咨询住宿 ↗','숙박 문의 ↗','ठहराव के बारे में पूछें ↗'],
    ['Made for your time here','Pensé pour votre séjour','مصمم لوقتك هنا','为此行精心打造','이곳에서의 시간을 위해','यहाँ के आपके समय के लिए'],
    ['Offers &','Offres et','العروض و','优惠与','혜택과','ऑफ़र और'],['packages.','forfaits.','الباقات.','套餐。','패키지.','पैकेज।'],
    ['Hotel-published experiences and seasonal packages. The hotel confirms current rates, availability and terms with every request.','Expériences et forfaits saisonniers publiés par l’hôtel. Les tarifs, disponibilités et conditions sont confirmés pour chaque demande.','تجارب وباقات موسمية ينشرها الفندق. يؤكد الفندق الأسعار والتوافر والشروط مع كل طلب.','酒店发布的体验与季节套餐。每次咨询均由酒店确认价格、空房及条款。','호텔이 소개하는 경험과 시즌 패키지입니다. 문의마다 현재 요금, 일정과 조건을 확인합니다.','होटल द्वारा साझा किए गए अनुभव और मौसमी पैकेज। हर अनुरोध पर होटल दर, उपलब्धता और शर्तें बताएगा।'],
    ['From the kitchen & bar','De la cuisine et du bar','من المطبخ والبار','来自厨房与酒吧','주방과 바에서','रसोई और बार से'],
    ['Come to','Venez à','تعال إلى','来此','이곳에서','आइए'],['the table.','table.','المائدة.','共享餐桌。','식탁으로.','मेज़ पर।'],
    ['Explore the latest menu and prices from the hotel team. Availability and daily specials may change.','Découvrez les derniers menus et prix de l’hôtel. Les disponibilités et plats du jour peuvent changer.','استكشف أحدث قائمة وأسعار من فريق الفندق. قد تتغير الإتاحة والأطباق اليومية.','查看酒店团队更新的菜单与价格。供应情况及每日特选可能变化。','호텔 팀의 최신 메뉴와 가격을 확인하세요. 이용 가능 여부와 오늘의 메뉴는 바뀔 수 있습니다.','होटल टीम का नवीनतम मेनू और मूल्य देखें। उपलब्धता और दैनिक विशेष बदल सकते हैं।'],
    ['Dietary and allergen tags are supplied by the hotel. Please confirm allergy and ingredient details with the restaurant.','Les informations alimentaires et allergènes sont fournies par l’hôtel. Vérifiez les ingrédients et allergies auprès du restaurant.','يوفر الفندق معلومات الأنظمة الغذائية ومسببات الحساسية. يرجى تأكيد التفاصيل مع المطعم.','饮食与过敏原标签由酒店提供。请与餐厅确认过敏情况及食材信息。','식단 및 알레르기 정보는 호텔이 제공합니다. 알레르기와 재료는 레스토랑에 확인해 주세요.','आहार और एलर्जेन की जानकारी होटल देता है। एलर्जी और सामग्री की पुष्टि रेस्तराँ से करें।'],
    ['Enquire about dining ↗','Demander une table ↗','استفسر عن الطعام ↗','咨询餐饮 ↗','식사 문의 ↗','भोजन के बारे में पूछें ↗'],
    ['A little more to enjoy','Un peu plus à découvrir','المزيد للاستمتاع','更多精彩体验','더 즐길 거리','आनंद के लिए और भी'],
    ['Stay in','Gardez','حافظ على','按自己的','나만의 리듬으로','अपनी'],['your rhythm.','votre rythme.','إيقاعك.','节奏享受。','리듬으로 머물다.','रफ़्तार में रहें।'],
    ['Take a dip, make time to unwind, or get together over a friendly game. Request a spa visit, paddle-court session or mini-golf round. The hotel confirms services, availability and rates.','Baignez-vous, détendez-vous ou retrouvez-vous autour d’un jeu. Demandez le spa, le padel ou le mini-golf ; l’hôtel confirme les services, disponibilités et tarifs.','استمتع بالسباحة أو الاسترخاء أو اللعب معًا. اطلب السبا أو البادل أو الجولف المصغر؛ ويؤكد الفندق الخدمات والتوافر والأسعار.','畅游、放松，或相约打一场友谊赛。可预约水疗、板式网球或迷你高尔夫，服务、空档与价格由酒店确认。','수영과 휴식, 친선 경기를 즐겨보세요. 스파, 패들 코트, 미니 골프를 문의하면 호텔이 서비스와 일정, 요금을 확인합니다.','तैरें, आराम करें या साथ में खेलें। स्पा, पैडल कोर्ट या मिनी गोल्फ़ के लिए अनुरोध करें; होटल सेवा, समय और दर की पुष्टि करेगा।'],
    ['Gather here','Réunissez-vous ici','اجتمع هنا','相聚于此','이곳에서 모여요','यहाँ मिलें'],['Good things','De beaux moments','لحظات جميلة','美好时光','좋은 순간을','अच्छे पल'],['in company.','ensemble.','معًا.','共度。','함께.','साथ में।'],
    ['See upcoming gatherings and occasions at The Ginnery. For a private celebration or meeting, send an enquiry.','Découvrez les prochains événements du Ginnery. Pour une célébration privée ou une réunion, envoyez une demande.','اطلع على الفعاليات القادمة في ذا جينري. أرسل استفسارًا للاحتفال الخاص أو الاجتماع.','查看 The Ginnery 即将举办的聚会与活动。私人庆祝或会议请提交咨询。','The Ginnery의 다가오는 모임과 행사를 확인하세요. 축하 행사나 회의는 문의해 주세요.','The Ginnery के आगामी आयोजनों को देखें। निजी उत्सव या बैठक के लिए पूछताछ भेजें।'],
    ['Plan an occasion ↗','Organiser une occasion ↗','خطط لمناسبة ↗','筹划活动 ↗','행사 계획 ↗','किसी अवसर की योजना ↗'],
    ['Pakwach, Northern Uganda','Pakwach, Nord de l’Ouganda','باكواش، شمال أوغندا','乌干达北部帕夸奇','파크와치, 우간다 북부','पक्वाच, उत्तरी युगांडा'],
    ['Find your way','Trouvez votre chemin','اعثر على طريقك','找到前往之路','길을 찾아','अपना रास्ता'],['to the river.','jusqu’au fleuve.','إلى النهر.','前往河畔。','강으로.','नदी तक।'],
    ['Set your plans in motion and find The Ginnery in Pakwach. For directions and the hotel’s latest arrival information, contact the team.','Préparez votre visite et retrouvez The Ginnery à Pakwach. Contactez l’équipe pour l’itinéraire et les dernières informations d’arrivée.','ابدأ التخطيط واعثر على ذا جينري في باكواش. تواصل مع الفريق للاتجاهات ومعلومات الوصول.','开始规划，找到位于帕夸奇的 The Ginnery。路线与最新抵达信息请联系酒店团队。','파크와치의 The Ginnery를 찾아오세요. 길 안내와 도착 정보는 팀에 문의해 주세요.','पक्वाच में The Ginnery तक पहुँचने की योजना बनाएँ। रास्ते और आगमन जानकारी के लिए टीम से संपर्क करें।'],
    ['Open hotel map ↗','Ouvrir la carte de l’hôtel ↗','افتح خريطة الفندق ↗','打开酒店地图 ↗','호텔 지도 열기 ↗','होटल का नक्शा खोलें ↗'],
    ['A look around','Un aperçu des lieux','نظرة حول المكان','环顾酒店','공간 둘러보기','एक नज़र आसपास'],
    ['Details worth','Des détails à','تفاصيل تستحق','值得珍藏的','간직할 만한','याद रखने योग्य'],['keeping.','garder.','الاحتفاظ بها.','细节。','디테일.','विवरण।'],
    ['Scenes from the rooms, table and grounds, shared by the hotel.','Des images des chambres, de la table et des jardins, partagées par l’hôtel.','مشاهد من الغرف والمائدة والحدائق يشاركها الفندق.','酒店分享的客房、餐桌与庭院景致。','호텔이 공유하는 객실과 식탁, 정원의 모습.','कमरों, मेज़ और परिसर के दृश्य, होटल की ओर से।'],
    ['People & place','Les personnes et le lieu','الناس والمكان','人与此地','사람과 공간','लोग और जगह'],['Made with','Façonné avec','صُنع بـ','用……打造','따뜻함으로 만든','से बना'],['warmth.','chaleur.','الدفء.','温度。','따뜻함.','गर्मजोशी।'],
    ['Meet some of the people who make a visit feel personal.','Rencontrez celles et ceux qui rendent votre visite personnelle.','تعرف على بعض من يجعلون زيارتك شخصية ومميزة.','认识让每次到访都更贴心的人们。','방문을 특별하게 만드는 사람들을 만나보세요.','उन लोगों से मिलें जो आपकी यात्रा को व्यक्तिगत बनाते हैं।'],
    ['Helpful details','Informations utiles','تفاصيل مفيدة','实用信息','유용한 정보','ज़रूरी जानकारी'],['A few things','Quelques points','بعض الأمور','一些','몇 가지','कुछ बातें'],['to know.','à savoir.','لمعرفتها.','须知。','알아두세요.','जानने योग्य।'],
    ['Current answers from the hotel team. Search a topic or open a question for details.','Réponses à jour de l’équipe de l’hôtel. Recherchez un sujet ou ouvrez une question.','إجابات حديثة من فريق الفندق. ابحث عن موضوع أو افتح سؤالًا للتفاصيل.','酒店团队提供的最新答复。搜索主题或展开问题查看详情。','호텔 팀의 최신 답변입니다. 주제를 검색하거나 질문을 열어 자세히 확인하세요.','होटल टीम के नवीनतम उत्तर। विषय खोजें या विवरण के लिए सवाल खोलें।'],
    ['Search guest questions','Rechercher dans les questions','ابحث في أسئلة الضيوف','搜索宾客问题','고객 질문 검색','मेहमानों के सवाल खोजें'],
    ['Notes from The Ginnery','Les nouvelles du Ginnery','ملاحظات من ذا جينري','来自 The Ginnery 的记录','The Ginnery의 소식','The Ginnery की बातें'],['Stories to','Des histoires à','حكايات','值得再次','다시 찾고 싶은','लौटकर पढ़ने'],['come back to.','relire.','للعودة إليها.','回味的故事。','이야기.','लायक कहानियाँ।'],
    ['New dishes, moments from the hotel and notes from the team. The journal is updated by The Ginnery.','Nouveaux plats, moments de l’hôtel et nouvelles de l’équipe. Le journal est mis à jour par The Ginnery.','أطباق جديدة ولحظات من الفندق وأخبار الفريق. يحدّث ذا جينري هذه المجلة.','新菜品、酒店日常与团队记录。日志由 The Ginnery 更新。','새로운 메뉴와 호텔의 순간, 팀의 소식. The Ginnery가 저널을 업데이트합니다.','नए पकवान, होटल के पल और टीम की बातें। The Ginnery इस डायरी को अपडेट करता है।'],
    ['Find The Ginnery on Maps','Trouver The Ginnery sur Maps','اعثر على ذا جينري على الخرائط','在地图上查找 The Ginnery','지도에서 The Ginnery 찾기','Maps पर The Ginnery खोजें'],
    ['Official Uganda visa application','Demande officielle de visa ougandais','طلب التأشيرة الأوغندية الرسمي','乌干达官方签证申请','우간다 공식 비자 신청','युगांडा का आधिकारिक वीज़ा आवेदन'],
    ['Entebbe International Airport information','Informations sur l’aéroport international d’Entebbe','معلومات مطار عنتيبي الدولي','恩德培国际机场信息','엔테베 국제공항 정보','एंटेबे अंतरराष्ट्रीय हवाई अड्डे की जानकारी'],
    ['Airport transfer request','Demande de transfert depuis l’aéroport','طلب النقل من المطار','机场接送申请','공항 이동 요청','हवाई अड्डा स्थानांतरण अनुरोध'],
    ['Availability, rates, policies and travel arrangements are confirmed directly with the hotel.','Les disponibilités, tarifs, conditions et modalités de voyage sont confirmés directement par l’hôtel.','يؤكد الفندق مباشرةً التوافر والأسعار والسياسات وترتيبات السفر.','空房、价格、政策与出行安排均由酒店直接确认。','이용 가능 여부와 요금, 정책, 여행 일정은 호텔이 직접 확인합니다.','उपलब्धता, दरें, नीतियाँ और यात्रा व्यवस्थाएँ होटल सीधे पुष्टि करता है。'],
    ['The Ginnery — A world apart, in Northern Uganda','The Ginnery — Un monde à part, dans le Nord de l’Ouganda','ذا جينري — عالم مختلف في شمال أوغندا','The Ginnery — 乌干达北部的世外之境','The Ginnery — 우간다 북부의 특별한 공간','The Ginnery — उत्तरी युगांडा में एक अलग दुनिया'],
    ['Explore The Ginnery — Pakwach, Uganda','Explorer The Ginnery — Pakwach, Ouganda','استكشف ذا جينري — باكواش، أوغندا','探索 The Ginnery — 乌干达帕夸奇','The Ginnery 둘러보기 — 우간다 파크와치','The Ginnery देखें — पक्वाच, युगांडा'],
    ['A refined Northern Uganda retreat for considered stays, dining and celebrations.','Un refuge raffiné dans le Nord de l’Ouganda, pour séjourner, dîner et célébrer.','ملاذ راقٍ في شمال أوغندا للإقامة وتناول الطعام والاحتفالات.','乌干达北部雅致之所，适合住宿、餐饮与庆祝。','세심한 숙박, 다이닝, 축하를 위한 우간다 북부의 특별한 휴식처.','सोच-समझकर ठहरने, भोजन और उत्सव के लिए उत्तरी युगांडा का सुरुचिपूर्ण ठिकाना।'],
    ['Explore the rooms, dining, activities, events and stories of The Ginnery in Pakwach, Uganda.','Découvrez les chambres, restaurants, activités, événements et récits du Ginnery à Pakwach, en Ouganda.','استكشف الغرف والمطاعم والأنشطة والفعاليات والحكايات في ذا جينري، باكواش، أوغندا.','探索位于乌干达帕夸奇的 The Ginnery 客房、餐饮、活动、聚会与故事。','우간다 파크와치 The Ginnery의 객실, 다이닝, 액티비티, 행사와 이야기를 만나보세요.','युगांडा के पक्वाच में The Ginnery के कमरे, भोजन, गतिविधियाँ, कार्यक्रम और कहानियाँ देखें।'],
    ['Search check-in, transport, dining…','Rechercher arrivée, transport, repas…','ابحث عن الوصول والنقل والطعام…','搜索入住、交通、餐饮…','체크인, 교통, 식사 검색…','चेक-इन, परिवहन, भोजन खोजें…'],
    ['Close ×','Fermer ×','إغلاق ×','关闭 ×','닫기 ×','बंद करें ×'],
    ['Read story ↗','Lire l’article ↗','اقرأ القصة ↗','阅读故事 ↗','이야기 읽기 ↗','कहानी पढ़ें ↗'],
    ['Enquire ↗','Demander ↗','استفسر ↗','咨询 ↗','문의 ↗','पूछताछ ↗'],
    ['All','Tout','الكل','全部','전체','सभी'],
    ['English heritage lends a note of permanence; Ugandan landscape and hospitality make it unmistakably The Ginnery.','L’héritage anglais apporte une note de permanence ; les paysages et l’hospitalité ougandais signent l’identité de The Ginnery.','يمنح الإرث الإنجليزي لمسة خالدة، فيما تجعل طبيعة أوغندا وكرمها ذا جينري مميزًا.','英格兰传统带来恒久气质；乌干达的风景与款待，成就 The Ginnery 的独特风格。','영국의 전통이 오래가는 품격을 더하고, 우간다의 풍경과 환대가 The Ginnery만의 정체성을 완성합니다.','अंग्रेज़ी विरासत स्थायित्व का भाव देती है; युगांडा की प्रकृति और मेहमाननवाज़ी The Ginnery को विशिष्ट बनाती है।'],
    ['The Ginnery · Northern Uganda','The Ginnery · Nord de l’Ouganda','ذا جينري · شمال أوغندا','The Ginnery · 乌干达北部','The Ginnery · 우간다 북부','The Ginnery · उत्तरी युगांडा'],
    ['Pakwach, Uganda','Pakwach, Ouganda','باكواش، أوغندا','乌干达帕夸奇','우간다 파크와치','पक्वाच, युगांडा'],
    ['Find us on Maps ↗','Nous trouver sur Maps ↗','اعثر علينا على الخرائط ↗','在地图上找到我们 ↗','지도에서 위치 찾기 ↗','Maps पर हमें खोजें ↗'],
    ['/ THE PLACE','/ LE LIEU','/ المكان','/ 此地','/ 공간','/ यह जगह'],
    ['Language','Langue','اللغة','语言','언어','भाषा'],['Updated','Mis à jour','تم التحديث','更新于','업데이트','अपडेट किया गया'],
    ['Room details and current rates are being updated by the hotel. Send a stay enquiry for the latest options.','Les informations sur les chambres et les tarifs sont mises à jour par l’hôtel. Envoyez une demande de séjour pour connaître les dernières options.','يحدّث الفندق تفاصيل الغرف والأسعار الحالية. أرسل استفسار إقامة لمعرفة أحدث الخيارات.','酒店正在更新客房详情与当前价格。提交住宿咨询以了解最新选择。','호텔이 객실 정보와 현재 요금을 업데이트하고 있습니다. 최신 옵션은 숙박 문의로 확인해 주세요.','होटल कमरे और मौजूदा दरों की जानकारी अपडेट कर रहा है। नए विकल्पों के लिए ठहरने की पूछताछ भेजें।'],
    ['Stay at The Ginnery','Séjourner au Ginnery','الإقامة في ذا جينري','入住 The Ginnery','The Ginnery 숙박','The Ginnery में ठहरें'],
    ['A considered place to rest during your time in Pakwach.','Un lieu pensé pour se reposer pendant votre séjour à Pakwach.','مكان مدروس للراحة خلال إقامتك في باكواش.','在帕夸奇期间安心休憩之所。','파크와치에서 편히 쉴 수 있도록 세심하게 마련한 공간입니다.','पक्वाच में आपके ठहराव के दौरान आराम के लिए एक सुकून भरी जगह।'],
    ['Ask for current rate','Demander le tarif actuel','اسأل عن السعر الحالي','询问当前价格','현재 요금 문의','मौजूदा दर पूछें'],
    ['All dietary & allergen tags','Tous les régimes et allergènes','كل أنواع الحمية ومسببات الحساسية','所有饮食与过敏原标签','식단 및 알레르기 태그 전체','सभी आहार और एलर्जी टैग'],
    ['The hotel team can add dishes and current prices here. Contact the restaurant for today’s menu.','L’équipe de l’hôtel peut ajouter ici les plats et leurs tarifs. Contactez le restaurant pour le menu du jour.','يمكن لفريق الفندق إضافة الأطباق والأسعار الحالية هنا. تواصل مع المطعم لمعرفة قائمة اليوم.','酒店团队可在此添加菜品与当前价格。今日菜单请联系餐厅。','호텔 팀이 이곳에 메뉴와 현재 가격을 추가할 수 있습니다. 오늘의 메뉴는 레스토랑에 문의해 주세요.','होटल टीम यहाँ व्यंजन और मौजूदा कीमतें जोड़ सकती है। आज के मेन्यू के लिए रेस्तराँ से संपर्क करें।'],
    ['No menu items match these filters at the moment.','Aucun plat ne correspond actuellement à ces filtres.','لا توجد أطباق تطابق هذه التصفية حاليًا.','目前没有符合这些筛选条件的菜品。','현재 필터와 일치하는 메뉴가 없습니다.','अभी इन फ़िल्टर से मेल खाने वाले व्यंजन नहीं हैं।'],
    ['Ask for price','Demander le prix','اسأل عن السعر','询价','가격 문의','कीमत पूछें'],
    ['Swimming pool','Piscine','مسبح','游泳池','수영장','स्विमिंग पूल'],['By the water','Au bord de l’eau','بجانب الماء','水畔','물가에서','पानी के पास'],
    ['Make time for a swim and a little pause in the day.','Prenez le temps de nager et de faire une pause dans la journée.','خصص وقتًا للسباحة وللاستراحة قليلًا خلال يومك.','留些时间畅游，让一天稍作停歇。','수영을 즐기며 하루 중 잠시 여유를 누려보세요.','तैरने और दिन में थोड़ा विराम लेने का समय निकालें।'],
    ['Wellbeing','Bien-être','العافية','身心舒缓','웰빙','आरोग्य'],['Step away from the day and make room to unwind.','Éloignez-vous du quotidien et prenez le temps de vous détendre.','ابتعد عن ضغوط اليوم واترك لنفسك مساحة للاسترخاء.','暂别日常，为放松留出时间。','하루의 분주함에서 벗어나 편안히 쉬어보세요.','दिनभर की भागदौड़ से हटकर आराम के लिए समय निकालें।'],
    ['Paddle court','Court de padel','ملعب البادل','板式网球场','패들 코트','पैडल कोर्ट'],['Play together','Jouez ensemble','العبوا معًا','一起玩乐','함께 즐기기','साथ मिलकर खेलें'],
    ['Bring family or friends together for a game on the court.','Réunissez famille ou amis pour une partie sur le court.','اجمع العائلة أو الأصدقاء للعب في الملعب.','与家人朋友相聚，在球场上来一场比赛。','가족이나 친구와 코트에서 함께 경기를 즐겨보세요.','परिवार या दोस्तों के साथ कोर्ट पर खेल का आनंद लें।'],
    ['Mini outdoor golf','Mini-golf en plein air','غولف مصغر في الهواء الطلق','户外迷你高尔夫','야외 미니 골프','आउटडोर मिनी गोल्फ'],['A friendly challenge','Un défi convivial','تحدٍ ودي','轻松有趣的挑战','즐거운 도전','एक दोस्ताना चुनौती'],
    ['Take your time over a relaxed round outside.','Profitez à votre rythme d’une partie en plein air.','استمتع بجولة هادئة في الهواء الطلق على مهل.','在户外悠闲地打一场，享受自在时光。','야외에서 여유롭게 한 라운드를 즐겨보세요.','बाहर आराम से एक राउंड खेलने का आनंद लें।'],
    ['At The Ginnery','Au Ginnery','في ذا جينري','在 The Ginnery','The Ginnery에서','The Ginnery में'],['Request a session ↗','Demander une séance ↗','اطلب جلسة ↗','预约体验 ↗','세션 문의 ↗','सेशन के लिए पूछें ↗'],
    ['There are no upcoming events listed right now. Ask the team about hosting a gathering.','Aucun événement à venir n’est affiché pour le moment. Contactez l’équipe pour organiser une réception.','لا توجد فعاليات قادمة مدرجة الآن. تواصل مع الفريق للاستفسار عن استضافة تجمع.','目前暂无即将举行的活动。欢迎联系团队，咨询聚会安排。','현재 예정된 행사가 없습니다. 모임 개최는 팀에 문의해 주세요.','अभी कोई आगामी कार्यक्रम सूचीबद्ध नहीं है। आयोजन के लिए टीम से पूछें।'],
    ['The team will introduce its people here.','L’équipe vous présentera ses membres ici.','سيقدم الفريق أعضاءه هنا.','团队将在此介绍成员。','팀이 이곳에서 구성원을 소개합니다.','टीम यहाँ अपने सदस्यों से परिचित कराएगी।'],
    ['The Ginnery will share journal updates, new menu items, events and moments from the hotel here.','The Ginnery partagera ici ses nouvelles, les nouveaux plats, les événements et les moments de l’hôtel.','سيشارك ذا جينري هنا تحديثات المجلة والأطباق الجديدة والفعاليات ولحظات من الفندق.','The Ginnery 将在此分享日志更新、新菜品、活动与酒店日常。','The Ginnery가 이곳에서 소식, 신메뉴, 행사와 호텔의 순간을 전합니다.','The Ginnery यहाँ डायरी अपडेट, नए व्यंजन, कार्यक्रम और होटल के पल साझा करेगा।'],
    ['Hotel journal','Journal de l’hôtel','مجلة الفندق','酒店日志','호텔 저널','होटल डायरी'],
    ['Ginnery experience','Expérience Ginnery','تجربة جينري','Ginnery 体验','Ginnery 경험','Ginnery अनुभव'],['All guests','Tous les clients','جميع الضيوف','所有宾客','모든 고객','सभी मेहमान'],
    ['Mention when enquiring','À mentionner lors de votre demande','اذكر ذلك عند الاستفسار','咨询时请提及','문의 시 말씀해 주세요','पूछताछ में इसका उल्लेख करें'],
    ['Enquire about this package ↗','Demander cette offre ↗','استفسر عن هذه الباقة ↗','咨询此套餐 ↗','패키지 문의 ↗','इस पैकेज के बारे में पूछें ↗'],
    ['No guest questions match your search.','Aucune question ne correspond à votre recherche.','لا توجد أسئلة من الضيوف تطابق بحثك.','没有符合搜索条件的宾客问题。','검색 결과와 일치하는 고객 질문이 없습니다.','आपकी खोज से मेल खाते मेहमानों के सवाल नहीं हैं।'],
    ['The hotel team is preparing answers to common guest questions.','L’équipe de l’hôtel prépare des réponses aux questions fréquentes des clients.','يُعدّ فريق الفندق إجابات عن أسئلة الضيوف الشائعة.','酒店团队正在准备宾客常见问题的答复。','호텔 팀이 자주 묻는 고객 질문에 대한 답변을 준비 중입니다.','होटल टीम आम सवालों के जवाब तैयार कर रही है।'],['Guest question','Question d’un client','سؤال ضيف','宾客问题','고객 질문','मेहमान का सवाल'],
    ['The hotel will share its activities here as details are confirmed.','L’hôtel présentera ici les activités dès que les informations seront confirmées.','سيشارك الفندق أنشطته هنا بعد تأكيد التفاصيل.','酒店确认详情后将在此分享活动信息。','세부 사항이 확정되면 호텔이 이곳에서 액티비티를 소개합니다.','विवरण तय होने पर होटल यहाँ गतिविधियाँ साझा करेगा।'],
    ['Mini golf','Mini-golf','غولف مصغر','迷你高尔夫','미니 골프','मिनी गोल्फ'],['Spa','Spa','السبا','水疗','스파','स्पा'],['Spa & wellness','Spa et bien-être','السبا والعافية','水疗与健康','스파 및 웰니스','स्पा और वेलनेस'],
    ['Close','Fermer','إغلاق','关闭','닫기','बंद करें'],['Close photo','Fermer la photo','إغلاق الصورة','关闭照片','사진 닫기','तस्वीर बंद करें'],['A view of The Ginnery','Vue du Ginnery','إطلالة على ذا جينري','The Ginnery 景观','The Ginnery의 풍경','The Ginnery का दृश्य'],
    ['A closer look','Un regard plus attentif','نظرة أقرب','近距离探索','더 가까이 둘러보기','एक नज़दीकी नज़र'],
    ['Beneath the fig tree','Sous le figuier','تحت شجرة التين','榕树之下','무화과나무 아래','अंजीर के पेड़ तले'],
    ['A slower kind of arrival in Northern Uganda.','Une arrivée plus paisible dans le nord de l’Ouganda.','وصول أكثر هدوءًا في شمال أوغندا.','在乌干达北部，开启一段从容的抵达。','우간다 북부에서 만나는 여유로운 도착.','उत्तरी युगांडा में एक धीमा, सुकून भरा आगमन।'],
    ['Pause beside the water','Faire une pause au bord de l’eau','استرح بجانب الماء','在水畔稍作停留','물가에서 잠시 쉬어가기','पानी के किनारे ठहरें'],
    ['Make space for a quiet moment by the pool.','Prenez le temps d’un moment paisible au bord de la piscine.','اترك لنفسك مساحة للحظة هادئة بجانب المسبح.','在泳池边，为片刻宁静留出空间。','수영장 옆에서 고요한 순간을 누려보세요.','पूल के पास एक शांत पल के लिए समय निकालें。'],
    ['Gather around the table','Se retrouver autour de la table','اجتمعوا حول المائدة','围坐餐桌','식탁에 둘러앉기','मेज़ के पास साथ आएँ'],
    ['Good food, easy conversation, another story.','De bons plats, une conversation légère, une nouvelle histoire.','طعام طيب وحديث مريح وحكاية أخرى.','美食、闲谈与又一个故事。','좋은 음식, 편안한 대화, 또 하나의 이야기.','अच्छा भोजन, सहज बातचीत और एक और कहानी।'],
    ['Previous scene','Scène précédente','المشهد السابق','上一个场景','이전 장면','पिछला दृश्य'],['Next scene','Scène suivante','المشهد التالي','下一个场景','다음 장면','अगला दृश्य'],
    ['Choose a scene','Choisir une scène','اختر مشهدًا','选择场景','장면 선택','दृश्य चुनें'],['Pause automatic slides','Mettre le carrousel en pause','إيقاف العرض التلقائي','暂停自动播放','자동 재생 일시 정지','स्वचालित स्लाइड रोकें'],
    ['Resume automatic slides','Reprendre le carrousel','استئناف العرض التلقائي','恢复自动播放','자동 재생 다시 시작','स्वचालित स्लाइड फिर चलाएँ'],
    ['Show the fig tree scene','Afficher la scène du figuier','اعرض مشهد شجرة التين','显示榕树场景','무화과나무 장면 보기','अंजीर के पेड़ का दृश्य दिखाएँ'],
    ['Show the pool scene','Afficher la scène de la piscine','اعرض مشهد المسبح','显示泳池场景','수영장 장면 보기','पूल का दृश्य दिखाएँ'],
    ['Show the dining scene','Afficher la scène du restaurant','اعرض مشهد المطعم','显示餐厅场景','다이닝 장면 보기','भोजन का दृश्य दिखाएँ']
  ];
  const staticCopy = Object.fromEntries(['fr', 'ar', 'zh', 'ko', 'hi'].map(locale => [locale, {}]));
  rows.forEach(([source, fr, ar, zh, ko, hi]) => {
    staticCopy.fr[source] = fr; staticCopy.ar[source] = ar;
    staticCopy.zh[source] = zh; staticCopy.ko[source] = ko; staticCopy.hi[source] = hi;
  });

  const bookingRows = [
    ['back','← 返回网站','← 웹사이트','← वेबसाइट'],['kicker','更从容的行程规划','여유로운 여행 계획','सोच-समझकर यात्रा की योजना'],
    ['title','让您的旅程<br><em>从心动开始。</em>','여행의 시작은<br><em>느낌에서.</em>','आपकी यात्रा शुरू होती है<br><em>एक एहसास से।</em>'],
    ['intro','在这里咨询住宿、餐桌、酒吧或活动。告诉我们您的想法，酒店团队将确认空房、最终价格与条款。','숙박, 식사, 바 이용, 행사 상담을 한곳에서 요청하세요. 원하시는 내용을 알려주시면 호텔 팀이 이용 가능 여부와 최종 요금, 조건을 확인합니다.','ठहरने, भोजन, बार या कार्यक्रम के बारे में एक ही जगह पूछताछ करें। अपनी योजना बताएँ; होटल टीम उपलब्धता, अंतिम मूल्य और शर्तें बताएगी।'],
    ['currencyNote','报价币种 · UGX / USD','견적 통화 · UGX / USD','मूल्य की मुद्रा · UGX / USD'],['noPay','提交咨询时无需付款。','문의 시 결제가 필요하지 않습니다.','पूछताछ भेजते समय भुगतान नहीं लिया जाता।'],
    ['bookingLabel','预订与咨询','예약 및 문의','बुकिंग और पूछताछ'],['bookingTitle','您想计划什么？','무엇을 계획하고 계신가요?','आप क्या योजना बनाना चाहते हैं?'],
    ['bookingDesc','选择一项服务并提交请求。酒店确认空房、价格与适用政策后，预订才成立。','서비스를 선택해 요청을 보내세요. 호텔이 가능 여부와 요금, 정책을 확인하기 전까지 예약은 확정되지 않습니다.','सेवा चुनकर अनुरोध भेजें। होटल उपलब्धता, मूल्य और लागू नीतियों की पुष्टि के बाद ही बुकिंग पक्की होगी।'],
    ['stay','住宿','숙박','ठहराव'],['dining','餐厅','레스토랑','रेस्तराँ'],['bar','酒吧','바','बार'],['events','活动','행사','कार्यक्रम'],
    ['stayHeading','住宿与客房','숙박 및 객실','ठहराव और आवास'],['stayIntro','填写日期与住宿偏好。价格和空房由酒店确认。','날짜와 객실 선호를 알려주세요. 요금과 이용 가능 여부는 호텔이 확인합니다.','तारीख और पसंदीदा कमरे बताएँ। दर और उपलब्धता होटल पुष्टि करेगा。'],
    ['diningHeading','餐厅预订咨询','레스토랑 예약 문의','रेस्तराँ आरक्षण पूछताछ'],['diningIntro','选择日期、时间与人数。菜单、营业时间和餐桌由酒店确认。','날짜, 시간, 인원을 선택하세요. 메뉴, 영업시간과 좌석은 호텔이 확인합니다.','तारीख, समय और मेहमानों की संख्या चुनें। मेनू, समय और टेबल होटल पुष्टि करेगा。'],
    ['barHeading','酒吧或私人休息区咨询','바 또는 프라이빗 라운지 문의','बार या निजी लाउंज पूछताछ'],['barIntro','告诉我们希望的时间与人数。座位和私人安排需经确认。','희망 시간과 인원을 알려주세요. 좌석과 별도 요청은 확인이 필요합니다.','अपना पसंदीदा समय और समूह बताएँ। बैठने और निजी व्यवस्था की पुष्टि होगी。'],
    ['eventsHeading','会议、庆典与活动','회의, 축하 및 행사','बैठकें, समारोह और कार्यक्रम'],['eventsIntro','填写日期、活动类型与预计人数，获取定制报价。','날짜, 행사 유형과 예상 인원을 보내 맞춤 견적을 요청하세요.','तारीख, कार्यक्रम का प्रकार और अनुमानित मेहमान बताएँ और विशेष मूल्य माँगें。'],
    ['checkIn','入住','체크인','चेक-इन'],['checkOut','退房','체크아웃','चेक-आउट'],['rooms','房间','객실','कमरे'],['adults','成人','성인','वयस्क'],['children','儿童','어린이','बच्चे'],
    ['roomPref','住宿偏好','객실 선호','आवास की पसंद'],['noPreference','无偏好 — 请为我推荐','선호 없음 — 추천해 주세요','कोई पसंद नहीं — सुझाव दें'],['room','客房','객실','कमरा'],['suite','套房','스위트','सुइट'],
    ['roomNote','房型仅为偏好；实际房态需由酒店确认。','객실 유형은 선호사항이며 실제 객실 재고는 호텔 확인이 필요합니다.','कमरे की श्रेणी केवल पसंद है; वास्तविक उपलब्धता होटल पुष्टि करेगा।'],
    ['date','日期','날짜','तारीख'],['time','时间','시간','समय'],['guests','用餐人数','식사 인원','भोजन करने वाले'],['occasion','场合','목적','अवसर'],['everyday','日常用餐','일반 식사','सामान्य भोजन'],
    ['businessLunch','商务午餐','비즈니스 점심','व्यावसायिक दोपहर का भोजन'],['birthday','生日','생일','जन्मदिन'],['anniversary','周年纪念','기념일','सालगिरह'],['familyMeal','家庭聚餐','가족 식사','पारिवारिक भोजन'],['other','其他','기타','अन्य'],
    ['dietary','饮食需求或特别要求','식단 또는 특별 요청','आहार संबंधी ज़रूरतें या विशेष अनुरोध'],['partySize','聚会人数','인원','समूह का आकार'],['casualVisit','轻松小聚','편안한 방문','सामान्य मुलाक़ात'],['privateGathering','私人聚会','프라이빗 모임','निजी सभा'],['barRequests','座位偏好或其他要求','좌석 선호 또는 요청','बैठने की पसंद या अनुरोध'],
    ['preferredDate','期望日期','희망 날짜','पसंदीदा तारीख'],['eventType','活动类型','행사 유형','कार्यक्रम का प्रकार'],['corporate','公司会议 / 商务午餐','기업 회의 / 비즈니스 점심','कॉर्पोरेट बैठक / व्यावसायिक भोजन'],['privateEvent','生日或私人庆祝','생일 또는 프라이빗 축하','जन्मदिन या निजी उत्सव'],['wedding','婚礼 / 婚宴','결혼식 / 피로연','शादी / स्वागत समारोह'],['conference','会议 / 工作坊','컨퍼런스 / 워크숍','सम्मेलन / कार्यशाला'],['attendees','预计参与人数','예상 참석 인원','अनुमानित उपस्थित लोग'],['notSure','尚未确定','아직 미정','अभी तय नहीं'],['format','形式 / 布置','형식 / 배치','प्रारूप / व्यवस्था'],['seated','宴席就座','착석','बैठकर'],['reception','站立式招待会','스탠딩 리셉션','खड़े होकर स्वागत'],['meeting','会议','회의','बैठक'],['eventDetails','活动详情与报价需求','행사 상세 및 견적 요청','कार्यक्रम विवरण और मूल्य संबंधी ज़रूरतें'],
    ['yourDetails','您的信息','고객 정보','आपकी जानकारी'],['fullName','姓名','성명','पूरा नाम'],['email','电子邮箱','이메일 주소','ईमेल पता'],['phone','电话 / WhatsApp','전화 / WhatsApp','फ़ोन / WhatsApp'],['residency','居住国家','거주 국가','निवास का देश'],['replyLanguage','回复语言偏好','답변 언어','जवाब की पसंदीदा भाषा'],['quoteCurrency','报价币种','견적 통화','मूल्य की मुद्रा'],
    ['currencyExplain','币种仅用于报价偏好；此处不显示未经核实的汇率换算。','통화는 견적 선호를 위한 것이며 확인되지 않은 환율은 표시하지 않습니다.','मुद्रा केवल मूल्य की पसंद है; अपुष्ट विनिमय दर नहीं दिखाई जाएगी。'],['additionalNotes','还有什么需要我们了解？','추가로 알려주실 내용','और कुछ जो हमें जानना चाहिए?'],
    ['travelPlanning','出行与付款偏好','여행 및 결제 선호','यात्रा और भुगतान की पसंद'],
    ['requestTransfer','我想咨询机场或车站接送（需确认）。','공항 또는 기차역 이동을 문의하고 싶습니다(확인 필요).','मैं हवाई अड्डे या स्टेशन से वाहन व्यवस्था पूछना चाहता/चाहती हूँ (पुष्टि के अधीन)।'],
    ['pickupPoint','接机机场 / 上车地点','픽업 공항 / 장소','पिकअप हवाई अड्डा / स्थान'],['arrivalInfo','抵达日期、时间或航班','도착 날짜, 시간 또는 항공편','आगमन तारीख, समय या उड़ान'],['paymentPreference','首选付款方式','선호 결제 방식','पसंदीदा भुगतान तरीका'],
    ['card','银行卡（需确认）','카드 (확인 필요)','कार्ड (पुष्टि के अधीन)'],['mobileMoney','手机移动支付（需确认）','모바일 머니 (확인 필요)','मोबाइल मनी (पुष्टि के अधीन)'],['bankTransfer','银行转账（需确认）','은행 송금 (확인 필요)','बैंक ट्रांसफ़र (पुष्टि के अधीन)'],['payAtProperty','到店付款（需确认）','현장 결제 (확인 필요)','प्रॉपर्टी पर भुगतान (पुष्टि के अधीन)'],['promo','优惠 / 企业代码（可选）','프로모션 / 기업 코드 (선택)','ऑफ़र / कंपनी कोड (वैकल्पिक)'],
    ['marketingConsent','是的，我愿意偶尔收到 The Ginnery 的酒店新闻与优惠信息。此选项为自愿选择，与本次咨询分开。','네, The Ginnery의 소식과 프로모션을 가끔 받고 싶습니다. 선택 사항이며 문의와 별개입니다.','हाँ, मुझे The Ginnery की खबरें और प्रचार ऑफ़र कभी-कभी भेजें। यह वैकल्पिक है और पूछताछ से अलग है。'],
    ['privacyNote','您的联系方式和咨询内容将供酒店员工查看并回复。提交此请求不代表预订已确认。','연락처와 문의 내용은 호텔 직원이 확인하고 답변하는 데 사용됩니다. 요청을 보내도 예약이 확정되는 것은 아닙니다.','आपकी संपर्क जानकारी और पूछताछ का उपयोग होटल कर्मचारी समीक्षा और जवाब देने के लिए करेंगे। अनुरोध भेजना पक्की बुकिंग नहीं है。'],
    ['submitRequest','发送咨询','요청 보내기','अनुरोध भेजें'],['requestReceived','已收到咨询','문의 접수 완료','पूछताछ प्राप्त हुई'],
    ['thankYou','感谢您。我们已收到您的咨询。','감사합니다. 문의가 접수되었습니다.','धन्यवाद। आपकी पूछताछ मिल गई है。'],
    ['requestSaved','您的咨询已提交酒店审核；这不是已确认的预订。','문의가 호텔 검토를 위해 저장되었습니다. 예약이 확정된 것은 아닙니다.','आपकी पूछताछ होटल की समीक्षा के लिए दर्ज हुई है। यह पक्की बुकिंग नहीं है。'],
    ['yourPlan','您的计划','요청 내용','आपकी योजना'],['pendingLabel','等待审核','검토 대기','समीक्षा लंबित'],
    ['summaryHeadline','一段旅程<br><em>从一个细节开始。</em>','여행은<br><em>작은 디테일에서.</em>','एक योजना शुरू होती है<br><em>एक छोटी बात से।</em>'],
    ['service','服务','서비스','सेवा'],['dates','日期','날짜','तारीख'],['party','宾客 / 人数','인원','मेहमान / समूह'],['currency','报价币种','견적 통화','मूल्य की मुद्रा'],
    ['rateStatus','价格','요금','मूल्य'],['quotePending','待报价','견적 예정','मूल्य दिया जाएगा'],['priceGuidance','价格与空房','요금 및 객실 여부','दर और उपलब्धता'],['confirmedDirect','由酒店直接确认','호텔에서 직접 확인','होटल सीधे पुष्टि करेगा'],
    ['rateNote','酒店将在安排付款前确认空房、批准价格、税费、取消条款与最终金额。','호텔은 결제를 준비하기 전에 객실 가능 여부, 승인된 요금, 세금, 취소 조건과 최종 금액을 확인합니다.','भुगतान से पहले होटल उपलब्धता, स्वीकृत दरें, कर, रद्द करने की शर्तें और कुल राशि की पुष्टि करेगा。'],
    ['travellerInfo','出行信息','여행 정보','यात्रा की जानकारी'],['travellerDesc','请使用官方信息规划行程。出发前请确认个人签证、疫苗接种和入境要求。','공식 정보를 이용해 여행을 준비하세요. 출발 전에 비자, 예방접종과 입국 요건을 확인하세요.','यात्रा योजना के लिए आधिकारिक जानकारी देखें। जाने से पहले वीज़ा, टीकाकरण और प्रवेश नियम जाँचें。'],
    ['visaLink','乌干达签证 / 电子移民','우간다 비자 / 전자 이민','युगांडा वीज़ा / ई-इमिग्रेशन'],['airportLink','恩德培机场信息','엔테베 공항 정보','एंटेबे हवाई अड्डे की जानकारी'],['mapLink','在地图上查找 The Ginnery','지도에서 The Ginnery 찾기','Maps पर The Ginnery खोजें'],
    ['beforePay','提交咨询后','문의 후','पूछताछ के बाद'],['policyNote','酒店会在确认前核实空房、价格与条款。此表单不收取付款。','호텔은 확정 전에 객실 가능 여부, 요금과 조건을 검토합니다. 이 양식은 결제를 받지 않습니다.','पुष्टि से पहले होटल उपलब्धता, दर और शर्तें देखेगा। यह फ़ॉर्म भुगतान नहीं लेता。'],
    ['localInternational','本地与国际旅客指南 ↗','현지 및 해외 고객 안내 ↗','स्थानीय और अंतरराष्ट्रीय अतिथि गाइड ↗'],
    ['footerText','空房、价格、条款与付款安排均由酒店直接确认。','객실 가능 여부, 요금, 조건과 결제 방식은 호텔이 직접 확인합니다.','उपलब्धता, दरें, शर्तें और भुगतान व्यवस्था होटल सीधे पुष्टि करता है。'],
    ['home','首页','홈','मुखपृष्ठ'],['chooseDates','选择日期','날짜 선택','तारीखें चुनें'],['notSelected','未选择','선택되지 않음','चयन नहीं किया'],
    ['arrivalFirst','退房日期必须晚于入住日期。','체크아웃은 체크인 이후여야 합니다.','चेक-आउट, चेक-इन के बाद होना चाहिए。'],
    ['nameRequired','请输入您的姓名。','성명을 입력하세요.','अपना पूरा नाम दर्ज करें。'],['emailRequired','请输入有效的电子邮箱。','올바른 이메일 주소를 입력하세요.','मान्य ईमेल पता दर्ज करें。'],['phoneRequired','请输入可联系到您的电话号码。','연락 가능한 전화번호를 입력하세요.','संपर्क के लिए फ़ोन नंबर दर्ज करें。'],
    ['requestPrefix','咨询已提交酒店审核。','호텔 검토를 위해 문의가 전송되었습니다.','पूछताछ होटल की समीक्षा के लिए भेजी गई。'],['refLabel','参考编号','참조 번호','संदर्भ'],['chooseService','请先选择一项服务。','먼저 서비스를 선택하세요.','पहले सेवा चुनें。'],
    ['rateNights','晚住宿','박 숙박','रातें'],['guestText','位宾客','명','मेहमान'],['requestStatus','等待酒店审核；这不是已确认的预订。','호텔 검토 대기 중이며 예약은 확정되지 않았습니다.','होटल की समीक्षा लंबित है; यह पक्की बुकिंग नहीं है。'],
    ['transferYes','已申请接送','이동 요청함','वाहन अनुरोध किया'],['transferNo','未申请接送','이동 요청 안 함','वाहन अनुरोध नहीं किया'],
    ['priceNights','价格由酒店确认；此咨询暂不提供预估金额。','요금은 호텔이 확인하며 이 문의에는 예상 금액이 제공되지 않습니다.','दर होटल पुष्टि करेगा; इस पूछताछ के लिए मूल्य अनुमान उपलब्ध नहीं है。'],
    ['requestError','无法发送咨询，请稍后重试。','요청을 보내지 못했습니다. 잠시 후 다시 시도해 주세요.','पूछताछ नहीं भेजी जा सकी। कृपया थोड़ी देर बाद प्रयास करें。']
  ];
  const booking = {
    zh: Object.fromEntries(bookingRows.map(([key, zh]) => [key, zh])),
    ko: Object.fromEntries(bookingRows.map(([key, _zh, ko]) => [key, ko])),
    hi: Object.fromEntries(bookingRows.map(([key, _zh, _ko, hi]) => [key, hi]))
  };
  const bookingAdditionalRows = [
    ['eventBudget','Indicative budget','Budget indicatif','الميزانية التقديرية','预算范围','예산 범위','अनुमानित बजट'],
    ['eventAccommodation','Guest accommodation needed?','Hébergement nécessaire ?','هل تحتاج إلى إقامة للضيوف؟','是否需要宾客住宿？','고객 숙박이 필요한가요?','क्या मेहमानों के लिए ठहरने की व्यवस्था चाहिए?'],
    ['eventCatering','Catering or food and beverage needs','Besoins en restauration et boissons','احتياجات الطعام والشراب','餐饮需求','케이터링 또는 식음료 요청','खानपान या भोजन और पेय की ज़रूरतें'],
    ['attendeesUpTo10','Up to 10','Jusqu’à 10','حتى 10','最多10人','최대 10명','10 तक'],['attendees11to25','11–25','11–25','11–25','11–25人','11–25명','11–25'],
    ['attendees26to50','26–50','26–50','26–50','26–50人','26–50명','26–50'],['attendees51to100','51–100','51–100','51–100','51–100人','51–100명','51–100'],
    ['attendees100plus','100+','Plus de 100','أكثر من 100','100人以上','100명 이상','100 से अधिक'],
    ['budgetNotSure','Not sure yet','Je ne sais pas encore','غير محدد بعد','暂不确定','아직 미정','अभी तय नहीं'],
    ['budgetUnder1m','Under UGX 1,000,000','Moins de 1 000 000 UGX','أقل من 1,000,000 شلن أوغندي','低于 1,000,000 UGX','UGX 1,000,000 미만','UGX 1,000,000 से कम'],
    ['budget1to5m','UGX 1,000,000–5,000,000','1 000 000–5 000 000 UGX','1,000,000–5,000,000 شلن أوغندي','1,000,000–5,000,000 UGX','UGX 1,000,000–5,000,000','UGX 1,000,000–5,000,000'],
    ['budget5to15m','UGX 5,000,000–15,000,000','5 000 000–15 000 000 UGX','5,000,000–15,000,000 شلن أوغندي','5,000,000–15,000,000 UGX','UGX 5,000,000–15,000,000','UGX 5,000,000–15,000,000'],
    ['budgetOver15m','Over UGX 15,000,000','Plus de 15 000 000 UGX','أكثر من 15,000,000 شلن أوغندي','高于 15,000,000 UGX','UGX 15,000,000 초과','UGX 15,000,000 से अधिक'],
    ['accommodationNo','No / not sure','Non / je ne sais pas','لا / غير متأكد','不需要 / 暂不确定','아니요 / 미정','नहीं / अभी तय नहीं'],
    ['accommodationYes','Yes, please discuss rooms','Oui, parlons des chambres','نعم، يرجى مناقشة الغرف','需要，请联系讨论客房','예, 객실을 상담하고 싶습니다','हाँ, कमरों के बारे में बात करें'],
    ['cateringPlaceholder','Meals, refreshments or dietary requests','Repas, rafraîchissements ou demandes alimentaires','الوجبات والمرطبات أو الطلبات الغذائية','餐食、茶歇或饮食需求','식사, 다과 또는 식단 요청','भोजन, जलपान या आहार संबंधी अनुरोध'],
    ['currencyUGX','UGX — Uganda shillings','UGX — shillings ougandais','UGX — شلن أوغندي','UGX — 乌干达先令','UGX — 우간다 실링','UGX — युगांडा शिलिंग'],
    ['currencyUSD','USD — US dollars','USD — dollars américains','USD — دولار أمريكي','USD — 美元','USD — 미국 달러','USD — अमेरिकी डॉलर']
  ];
  const bookingAdditional = Object.fromEntries(['en','fr','ar','zh','ko','hi'].map((locale,index)=>[locale,Object.fromEntries(bookingAdditionalRows.map(([key,...values])=>[key,values[index]]))]));
  const bookingServiceRows = [
    ['paddleHeading','Paddle-court session','Séance de padel','Séance de padel','板式网球体验','패들 코트 세션','पैडल कोर्ट सत्र'],
    ['paddleIntro','Choose a date and time for a paddle-court session. The hotel confirms availability and rates.','Choisissez une date et une heure pour le padel. L’hôtel confirmera les disponibilités et les tarifs.','اختر موعدًا لجلسة البادل؛ يؤكد الفندق التوافر والأسعار.','选择板式网球体验的日期与时间。酒店将确认是否可预约及价格。','패들 코트 세션 날짜와 시간을 선택하세요. 호텔이 이용 가능 여부와 요금을 확인합니다.','पैडल कोर्ट सत्र के लिए तारीख और समय चुनें। होटल उपलब्धता और दरें बताएगा।'],
    ['golfHeading','Mini outdoor golf','Mini-golf en plein air','غولف مصغر في الهواء الطلق','户外迷你高尔夫','야외 미니 골프','आउटडोर मिनी गोल्फ'],
    ['golfIntro','Choose a date and time for mini golf. The hotel confirms availability and rates.','Choisissez une date et une heure pour le mini-golf. L’hôtel confirmera les disponibilités et les tarifs.','اختر موعدًا للغولف المصغر؛ يؤكد الفندق التوافر والأسعار.','选择迷你高尔夫的日期与时间。酒店将确认是否可预约及价格。','미니 골프 날짜와 시간을 선택하세요. 호텔이 이용 가능 여부와 요금을 확인합니다.','मिनी गोल्फ के लिए तारीख और समय चुनें। होटल उपलब्धता और दरें बताएगा।'],
    ['spaHeading','Spa & wellness request','Demande de spa et bien-être','طلب سبا وعافية','水疗与健康体验咨询','스파 및 웰니스 문의','स्पा और वेलनेस पूछताछ'],
    ['spaIntro','Tell the hotel which treatment or wellness experience you are interested in. The team will confirm availability and rates.','Indiquez le soin ou l’expérience bien-être qui vous intéresse. L’équipe confirmera les disponibilités et les tarifs.','أخبر الفندق بالعلاج أو تجربة العافية التي ترغب بها؛ يؤكد الفريق التوافر والأسعار.','请告知您感兴趣的护理或健康体验。酒店团队将确认是否可预约及价格。','원하시는 트리트먼트나 웰니스 경험을 알려주세요. 팀이 이용 가능 여부와 요금을 확인합니다.','अपनी पसंद का उपचार या वेलनेस अनुभव बताएँ। टीम उपलब्धता और दरें बताएगी।'],
    ['paddleService','Paddle court','Padel','ملعب بادل','板式网球','패들 코트','पैडल कोर्ट'],
    ['golfService','Mini golf','Mini-golf','غولف مصغر','迷你高尔夫','미니 골프','मिनी गोल्फ'],
    ['spaService','Spa & wellness','Spa et bien-être','السبا والعافية','水疗与健康','스파 및 웰니스','स्पा और वेलनेस'],
    ['players','players','joueurs','لاعبين','位球员','명','खिलाड़ी'],['spaGuests','spa guest(s)','personne(s) au spa','ضيف/ضيوف للسبا','位水疗宾客','명','स्पा अतिथि'],
    ['confirmationTemplate','{service} · {date} · {time} · {guests} {unit}. The hotel will contact you to confirm availability and rates.','{service} · {date} · {time} · {guests} {unit}. L’hôtel vous contactera pour confirmer les disponibilités et les tarifs.','{service} · {date} · {time} · {guests} {unit}. سيتواصل معك الفندق لتأكيد التوافر والأسعار.','{service} · {date} · {time} · {guests} {unit}。酒店将联系您确认是否可预约及价格。','{service} · {date} · {time} · {guests} {unit}. 호텔이 이용 가능 여부와 요금을 확인하기 위해 연락드리겠습니다.','{service} · {date} · {time} · {guests} {unit}. उपलब्धता और दरें बताने के लिए होटल आपसे संपर्क करेगा।']
  ];
  const bookingServices = Object.fromEntries(['en','fr','ar','zh','ko','hi'].map((locale,index)=>[locale,Object.fromEntries(bookingServiceRows.map(([key,...values])=>[key,values[index]]))]));
  const bookingExtraRows = [
    ['Paddle court','Paddle court','Padel','ملعب بادل','板式网球','패들 코트','पैडल कोर्ट'],['Mini golf','Mini golf','Mini-golf','غولف مصغر','迷你高尔夫','미니 골프','मिनी गोल्फ'],['Spa & wellness','Spa & wellness','Spa et bien-être','السبا والعافية','水疗与健康','스파 및 웰니스','स्पा और वेलनेस'],
    ['Preferred day','Preferred day','Jour souhaité','اليوم المفضل','首选日期','희망 날짜','पसंदीदा दिन'],['Preferred start time','Preferred start time','Heure de début souhaitée','وقت البدء المفضل','首选开始时间','희망 시작 시간','पसंदीदा शुरू होने का समय'],
    ['Players','Players','Joueurs','عدد اللاعبين','球员人数','플레이어 수','खिलाड़ियों की संख्या'],['Session length','Session length','Durée de la séance','مدة الجلسة','体验时长','세션 시간','सत्र की अवधि'],['Session notes','Session notes','Notes sur la séance','ملاحظات الجلسة','体验备注','세션 메모','सत्र संबंधी नोट'],
    ['Rounds','Rounds','Parties','الجولات','轮数','라운드','राउंड'],['Treatment or experience','Treatment or experience','Soin ou expérience','العلاج أو التجربة','护理或体验','트리트먼트 또는 경험','उपचार या अनुभव'],
    ['Preferred duration','Preferred duration','Durée souhaitée','المدة المفضلة','首选时长','희망 시간','पसंदीदा अवधि'],['Guests','Guests','Clients','الضيوف','宾客','고객','मेहमान'],['Additional notes','Additional notes','Notes complémentaires','ملاحظات إضافية','补充备注','추가 메모','अतिरिक्त जानकारी'],
    ['30 minutes','30 minutes','30 minutes','30 دقيقة','30分钟','30분','30 मिनट'],['1 hour','1 hour','1 heure','ساعة واحدة','1小时','1시간','1 घंटा'],['60 minutes','60 minutes','60 minutes','60 دقيقة','60分钟','60분','60 मिनट'],['90 minutes','90 minutes','90 minutes','90 دقيقة','90分钟','90분','90 मिनट'],['2 hours','2 hours','2 heures','ساعتان','2小时','2시간','2 घंटे'],['Not sure','Not sure','Je ne sais pas','غير متأكد','暂不确定','미정','अभी तय नहीं'],['Other / not sure','Other / not sure','Autre / je ne sais pas','أخرى / غير متأكد','其他 / 暂不确定','기타 / 미정','अन्य / अभी तय नहीं'],
    ['Any court or equipment requests','Any court or equipment requests','Demandes concernant le court ou le matériel','أي طلبات للملعب أو المعدات','球场或器材需求','코트 또는 장비 요청','कोर्ट या उपकरण संबंधी अनुरोध'],['Any equipment or access requests','Any equipment or access requests','Demandes de matériel ou d’accès','أي طلبات للمعدات أو سهولة الوصول','器材或无障碍需求','장비 또는 접근성 요청','उपकरण या पहुँच संबंधी अनुरोध'],['Treatment or wellness experience you are interested in','Treatment or wellness experience you are interested in','Soin ou expérience bien-être souhaité','العلاج أو تجربة العافية التي ترغب بها','您感兴趣的护理或健康体验','관심 있는 트리트먼트 또는 웰니스 경험','आपकी पसंद का उपचार या वेलनेस अनुभव'],['Accessibility, preferred therapist or other requests','Accessibility, preferred therapist or other requests','Accessibilité, thérapeute souhaité ou autres demandes','تسهيلات الوصول أو المعالج المفضل أو طلبات أخرى','无障碍需求、理疗师偏好或其他要求','접근성, 선호 테라피스트 또는 기타 요청','सुगम्यता, पसंदीदा थेरपिस्ट या अन्य अनुरोध'],
    ['Package reference included. The hotel will confirm inclusions, applicable rates and availability.','Package reference included. The hotel will confirm inclusions, applicable rates and availability.','Référence de l’offre incluse. L’hôtel confirmera son contenu, les tarifs et les disponibilités.','تم تضمين مرجع الباقة. سيؤكد الفندق تفاصيلها والأسعار والتوافر.','已附套餐编号。酒店将确认包含项目、适用价格及可订情况。','패키지 참조가 포함되었습니다. 호텔이 포함 사항, 요금 및 이용 가능 여부를 확인합니다.','पैकेज संदर्भ जोड़ा गया है। होटल शामिल सुविधाओं, दरों और उपलब्धता की पुष्टि करेगा।'],
    ['Enter your name, a valid email and a reachable phone number.','Enter your name, a valid email and a reachable phone number.','Saisissez votre nom, une adresse e-mail valide et un numéro joignable.','أدخل اسمك وبريدًا إلكترونيًا صالحًا ورقم هاتف يمكن الوصول إليك عليه.','请输入姓名、有效邮箱和可联系到您的电话号码。','이름, 유효한 이메일 주소와 연락 가능한 전화번호를 입력하세요.','अपना नाम, सही ईमेल और संपर्क योग्य फ़ोन नंबर दर्ज करें।'],
    ['Choose a future date and start time.','Choose a future date and start time.','Choisissez une date future et une heure de début.','اختر تاريخًا ووقت بدء في المستقبل.','请选择未来日期和开始时间。','미래 날짜와 시작 시간을 선택하세요.','भविष्य की तारीख और शुरू होने का समय चुनें।'],
    ['Tell the spa team which treatment or wellness experience you would like.','Tell the spa team which treatment or wellness experience you would like.','Indiquez à l’équipe du spa le soin ou l’expérience bien-être souhaité.','أخبر فريق السبا بالعلاج أو تجربة العافية التي ترغب بها.','请告知水疗团队您想体验的护理或健康项目。','원하시는 트리트먼트나 웰니스 경험을 스파 팀에 알려주세요.','स्पा टीम को बताएँ कि आप कौन-सा उपचार या वेलनेस अनुभव चाहते हैं।'],
    ['Your request could not be sent. Please try again.','Your request could not be sent. Please try again.','Votre demande n’a pas pu être envoyée. Veuillez réessayer.','تعذر إرسال طلبك. يرجى المحاولة مرة أخرى.','请求未能发送，请重试。','요청을 보내지 못했습니다. 다시 시도해 주세요.','आपका अनुरोध नहीं भेजा जा सका। कृपया पुनः प्रयास करें。']
  ];
  const bookingExtras = Object.fromEntries(['en','fr','ar','zh','ko','hi'].map((locale,index)=>[locale,Object.fromEntries(bookingExtraRows.map(([key,...values])=>[key,values[index]]))]));
  window.GinneryI18n = {
    locales: Object.keys(localeTags), booking, bookingAdditional, bookingServices, bookingExtras,
    translate(text, locale = getLanguage()) { return staticCopy[locale]?.[text] || text; },
    localeTag(locale = getLanguage()) { return localeTags[locale] || localeTags.en; },
    currentLanguage() { return getLanguage(); },
    rememberLanguage(locale) {
      if (!localeTags[locale]) return;
      activeLocale = locale;
      try { localStorage.setItem('ginnery_preferred_language', locale); } catch (_) {}
      document.documentElement.lang = localeTags[locale];
    },
    setLanguage(locale) {
      if (!localeTags[locale]) return;
      this.rememberLanguage(locale);
      document.querySelectorAll('#homeLanguage,#exploreLanguage').forEach(select => { select.value = locale; });
      applyStatic(locale);
      document.dispatchEvent(new CustomEvent('ginnery:languagechange', { detail: { locale } }));
    }
  };

  const textOriginal = new WeakMap(), textRendered = new WeakMap(), attributeState = new WeakMap();
  const translatedAttributes = ['placeholder', 'aria-label', 'title', 'alt', 'content'];
  function getLanguage() {
    if (localeTags[activeLocale]) return activeLocale;
    let locale = new URL(location.href).searchParams.get('lang');
    try { locale = locale || localStorage.getItem('ginnery_preferred_language'); } catch (_) {}
    return localeTags[locale] ? locale : 'en';
  }
  function translateNode(node, locale) {
    const current = node.nodeValue || '', sourceText = current.trim();
    if (!sourceText) return;
    let source = textOriginal.get(node);
    if (source === undefined || (textRendered.has(node) && sourceText !== textRendered.get(node))) {
      source = sourceText; textOriginal.set(node, source);
    }
    const value = staticCopy[locale]?.[source] || source;
    const updated = (current.match(/^\s*/)?.[0] || '') + value + (current.match(/\s*$/)?.[0] || '');
    if (node.nodeValue !== updated) node.nodeValue = updated;
    textRendered.set(node, value);
  }
  function translateAttributes(element, locale) {
    let state = attributeState.get(element);
    if (!state) { state = {}; attributeState.set(element, state); }
    translatedAttributes.forEach(name => {
      if (!element.hasAttribute(name)) return;
      const current = element.getAttribute(name) || '';
      let field = state[name];
      if (!field || current !== field.rendered) field = { source: current, rendered: current };
      element.setAttribute(name, staticCopy[locale]?.[field.source] || field.source);
      field.rendered = element.getAttribute(name) || ''; state[name] = field;
    });
  }
  function applyStatic(locale) {
    if (document.querySelector('#bookingForm')) return;
    document.documentElement.lang = localeTags[locale] || localeTags.en;
    document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr';
    const walker = document.createTreeWalker(document.documentElement, NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) {
      if (!node.parentElement?.closest('script,style,noscript,svg')) translateNode(node, locale);
    }
    document.querySelectorAll('*').forEach(element => translateAttributes(element, locale));
    document.querySelectorAll('#homeLanguage,#exploreLanguage').forEach(select => { select.value = locale; });
  }
  function initialize() {
    const locale = getLanguage();
    window.GinneryI18n.rememberLanguage(locale); applyStatic(locale);
    document.querySelectorAll('#homeLanguage,#exploreLanguage').forEach(select => {
      if (select.dataset.localeBound) return;
      select.dataset.localeBound = 'true';
      select.addEventListener('change', () => window.GinneryI18n.setLanguage(select.value));
    });
    if (!document.querySelector('#bookingForm') && 'MutationObserver' in window) {
      const observer = new MutationObserver(changes => {
        const currentLocale = getLanguage();
        changes.forEach(change => {
          if (change.type === 'characterData') translateNode(change.target, currentLocale);
          change.addedNodes?.forEach(added => {
            if (added.nodeType === Node.TEXT_NODE) translateNode(added, currentLocale);
            else if (added.nodeType === Node.ELEMENT_NODE) {
              const walker = document.createTreeWalker(added, NodeFilter.SHOW_TEXT);
              let child; while ((child = walker.nextNode())) translateNode(child, currentLocale);
              translateAttributes(added, currentLocale);
              added.querySelectorAll?.('*').forEach(element => translateAttributes(element, currentLocale));
            }
          });
        });
      });
      observer.observe(document.body, { subtree: true, childList: true, characterData: true });
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initialize, { once: true });
  else initialize();
})();
