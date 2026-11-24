(()=>{
  const $=selector=>document.querySelector(selector),form=$('#bookingForm');if(!form)return;
  const locale=()=>window.GinneryI18n?.currentLanguage?.()||'en';
  const extraDictionary=()=>window.GinneryI18n?.bookingExtras?.[locale()]||{};
  const translate=text=>extraDictionary()[text]||text;
  const serviceDictionary=()=>window.GinneryI18n?.bookingServices?.[locale()]||{};
  const field=(id,label,control)=>{const wrap=document.createElement('div');wrap.className='field';const text=document.createElement('label');text.htmlFor=id;text.dataset.extraLabel=label;text.textContent=translate(label);wrap.append(text,control);return wrap;};
  const input=(id,type='text')=>{const el=document.createElement('input');el.id=id;el.name=id;el.type=type;return el;};
  const select=(id,values)=>{const el=document.createElement('select');el.id=id;el.name=id;values.forEach(value=>{const option=document.createElement('option');option.value=value;option.dataset.extraLabel=value;option.textContent=translate(value);el.append(option);});return el;};
  const panel=(id,items)=>{const wrap=document.createElement('div');wrap.id=id;wrap.className='form-grid service-fields';wrap.hidden=true;items.forEach(item=>wrap.append(item));return wrap;};
  const setPlaceholder=(el,key)=>{el.dataset.extraPlaceholder=key;el.placeholder=translate(key);};
  const updateExtras=()=>{
    document.querySelectorAll('[data-extra-label]').forEach(el=>{el.textContent=translate(el.dataset.extraLabel);});
    document.querySelectorAll('[data-extra-placeholder]').forEach(el=>{el.placeholder=translate(el.dataset.extraPlaceholder);});
    const offerNote=$('#offerContext');if(offerNote?.dataset.extraLabel)offerNote.textContent=translate(offerNote.dataset.extraLabel);
  };
  const updateSupplementalBooking=()=>{
    const copy=window.GinneryI18n?.bookingAdditional?.[locale()]||{};
    const fields={attendees:{label:null,options:['attendeesUpTo10','attendees11to25','attendees26to50','attendees51to100','attendees100plus','budgetNotSure']},eventBudget:{label:'eventBudget',options:['budgetNotSure','budgetUnder1m','budget1to5m','budget5to15m','budgetOver15m']},eventAccommodation:{label:'eventAccommodation',options:['accommodationNo','accommodationYes']},currencyPref:{label:null,options:['currencyUGX','currencyUSD']},eventCatering:{label:'eventCatering',options:[]}};
    Object.entries(fields).forEach(([id,spec])=>{const control=$(`#${id}`),label=document.querySelector(`label[for="${id}"]`);if(spec.label&&label)label.textContent=copy[spec.label]||spec.label;if(control)Array.from(control.options||[]).forEach((option,index)=>{const key=spec.options[index];if(key)option.textContent=copy[key]||option.textContent;});});
    const catering=$('#eventCatering');if(catering)catering.placeholder=copy.cateringPlaceholder||catering.placeholder;
  };
  const todayParts=new Intl.DateTimeFormat('en-GB',{timeZone:'Africa/Kampala',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date()).reduce((out,item)=>(out[item.type]=item.value,out),{});const minDate=`${todayParts.year}-${todayParts.month}-${todayParts.day}`;
  const paddleDate=input('paddleDate','date');paddleDate.min=minDate;const paddleTime=input('paddleTime','time');
  const paddlePlayers=select('paddlePlayers',['2','4','5','6','Other / not sure']),paddleDuration=select('paddleDuration',['30 minutes','1 hour','90 minutes','2 hours','Not sure']);
  const paddleNotes=input('paddleNotes');setPlaceholder(paddleNotes,'Any court or equipment requests');
  const paddle=panel('fieldsPaddle',[field('paddleDate','Preferred day',paddleDate),field('paddleTime','Preferred start time',paddleTime),field('paddlePlayers','Players',paddlePlayers),field('paddleDuration','Session length',paddleDuration),field('paddleNotes','Session notes',paddleNotes)]);
  const golfDate=input('golfDate','date');golfDate.min=minDate;const golfTime=input('golfTime','time');
  const golfPlayers=select('golfPlayers',['1','2','4','5','6','Other / not sure']),golfRounds=select('golfRounds',['1','2','Not sure']);
  const golfNotes=input('golfNotes');setPlaceholder(golfNotes,'Any equipment or access requests');
  const golf=panel('fieldsMiniGolf',[field('golfDate','Preferred day',golfDate),field('golfTime','Preferred start time',golfTime),field('golfPlayers','Players',golfPlayers),field('golfRounds','Rounds',golfRounds),field('golfNotes','Session notes',golfNotes)]);
  const spaDate=input('spaDate','date');spaDate.min=minDate;const spaTime=input('spaTime','time');
  const spaTreatment=input('spaTreatment');spaTreatment.maxLength=160;setPlaceholder(spaTreatment,'Treatment or wellness experience you are interested in');
  const spaDuration=select('spaDuration',['30 minutes','60 minutes','90 minutes','Not sure']);
  const spaGuests=select('spaGuests',['1','2','3','4']);
  const spaNotes=document.createElement('textarea');spaNotes.id='spaNotes';spaNotes.name='spaNotes';spaNotes.rows=3;spaNotes.maxLength=500;setPlaceholder(spaNotes,'Accessibility, preferred therapist or other requests');
  const spa=panel('fieldsSpa',[field('spaDate','Preferred day',spaDate),field('spaTime','Preferred start time',spaTime),field('spaTreatment','Treatment or experience',spaTreatment),field('spaDuration','Preferred duration',spaDuration),field('spaGuests','Guests',spaGuests),field('spaNotes','Additional notes',spaNotes)]);
  const events=$('#fieldsEvents');events.after(paddle,golf,spa);
  const tabs=$('.service-tabs');tabs.style.gridTemplateColumns='repeat(4,minmax(0,1fr))';
  const style=document.createElement('style');style.textContent='@media(max-width:900px){.service-tabs{grid-template-columns:repeat(3,minmax(0,1fr))!important}}@media(max-width:520px){.service-tabs{grid-template-columns:repeat(2,minmax(0,1fr))!important}}.service-tab{min-width:0}.service-tab b{white-space:nowrap}.offer-context{margin:10px 0;color:var(--gold2);font-size:11px;line-height:1.7}';document.head.append(style);
  const extras=[['paddle','Paddle court','⌁'],['mini_golf','Mini golf','◦'],['spa','Spa & wellness','✧']];
  extras.forEach(([service,label,icon])=>{const button=document.createElement('button');button.className='service-tab';button.type='button';button.dataset.service=service;button.setAttribute('role','tab');button.setAttribute('aria-selected','false');const mark=document.createElement('span');mark.textContent=icon;const title=document.createElement('b');title.dataset.extraLabel=label;title.textContent=translate(label);button.append(mark,title);button.addEventListener('click',()=>window.dispatchEvent(new CustomEvent('ginnery-set-service',{detail:{service}})));tabs.append(button);});
  const updateAllBookingExtras=()=>{updateExtras();updateSupplementalBooking();};
  document.addEventListener('ginnery:languagechange',updateAllBookingExtras);updateAllBookingExtras();
  const currentService=()=>$('#serviceType').value;
  form.addEventListener('change',()=>{if(['paddle','mini_golf','spa'].includes(currentService()))window.dispatchEvent(new Event('ginnery-update-summary'));});
  if(['paddle','mini_golf','spa'].includes(currentService()))window.dispatchEvent(new CustomEvent('ginnery-set-service',{detail:{service:currentService()}}));
  const query=new URL(location.href).searchParams,offerId=query.get('offer')||'';const codeField=$('#promoCode');if(codeField&&query.get('promo')&&!codeField.value)codeField.value=query.get('promo');
  if(offerId){const note=$('#offerContext');if(note){note.hidden=false;note.dataset.extraLabel='Package reference included. The hotel will confirm inclusions, applicable rates and availability.';note.textContent=translate(note.dataset.extraLabel);}}
  document.addEventListener('submit',async event=>{
    if(event.target!==form||!['paddle','mini_golf','spa'].includes(currentService()))return;
    event.preventDefault();event.stopImmediatePropagation();
    const service=currentService(),isSpa=service==='spa',isPaddle=service==='paddle';
    const prefix=isSpa?'spa':isPaddle?'paddle':'golf',date=$(`#${prefix}Date`).value,time=$(`#${prefix}Time`).value;
    const name=$('#guestName').value.trim(),email=$('#guestEmail').value.trim(),phone=$('#guestPhone').value.trim();
    const future=date&&time&&new Date(`${date}T${time}:00+03:00`)>new Date();
    if(!name||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||phone.length<6){window.showToast?.(translate('Enter your name, a valid email and a reachable phone number.'));return;}
    if(!future){window.showToast?.(translate('Choose a future date and start time.'));return;}
    const guests=isSpa?$('#spaGuests').value:isPaddle?$('#paddlePlayers').value:$('#golfPlayers').value;
    if(isSpa&&!$('#spaTreatment').value.trim()){window.showToast?.(translate('Tell the spa team which treatment or wellness experience you would like.'));$('#spaTreatment').focus();return;}
    const keys=isSpa?['spaDate','spaTime','spaTreatment','spaDuration','spaGuests','spaNotes']:isPaddle?['paddleDate','paddleTime','paddlePlayers','paddleDuration','paddleNotes']:['golfDate','golfTime','golfPlayers','golfRounds','golfNotes'];
    const details=Object.fromEntries(keys.map(id=>[id,$(`#${id}`).value.trim()]));
    const button=form.querySelector('button[type="submit"]');button.disabled=true;
    const obj={analyticsVisitorId:window.GinneryAnalytics?.visitorId?.()||'',analyticsConsentId:window.GinneryAnalytics?.consentId?.()||'',offerId,service,status:'New request',paymentStatus:'Not collected',dateSummary:`${date} · ${time}`,guestCount:isSpa?`${guests} spa guest(s)`:`${guests} players`,guestName:name,guestEmail:email,guestPhone:phone,nationality:$('#nationality').value,languagePref:$('#languagePref').value,currency:$('#currencyPref').value,paymentPreference:$('#paymentPreference').value,transferRequested:false,pickupPoint:'',arrivalInfo:'',notes:$('#guestNotes').value.trim(),promoCode:$('#promoCode').value.trim(),marketingConsent:$('#marketingOptIn')?.checked===true,details};
    try{const response=await fetch('/api/reservations',{method:'POST',headers:{'Content-Type':'application/json'},credentials:'same-origin',body:JSON.stringify(obj)});const data=await response.json();if(!response.ok||!data.ok)throw new Error(data.error||'Your request could not be sent.');$('#referenceNumber').textContent=data.reservation.reference;const serviceCopy=serviceDictionary(),title=isSpa?serviceCopy.spaService:isPaddle?serviceCopy.paddleService:serviceCopy.golfService,unit=isSpa?serviceCopy.spaGuests:serviceCopy.players;const template=serviceCopy.confirmationTemplate||'{service} · {date} · {time} · {guests} {unit}. The hotel will contact you to confirm availability and rates.';$('#confirmationSummary').textContent=template.replace('{service}',title).replace('{date}',date).replace('{time}',time).replace('{guests}',guests).replace('{unit}',unit);$('#confirmation').classList.add('show');$('#confirmation').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'nearest'});}catch(error){window.showToast?.(translate('Your request could not be sent. Please try again.'));}finally{button.disabled=false;}
  },true);
})();
