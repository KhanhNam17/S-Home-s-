/* Local UI prototype only. No authentication, backend or cross-page data store. */
(() => {
  'use strict';
  const current = location.pathname.split('/').pop() || 'index.html';
  const pages = window.SHOMES_PAGES || [];
  const available = new Set([...pages.map(p => p.file), 'start.html']);
  const routes = {
    'tenant-home':'index.html', 'compare-rooms':'compare.html',
    'auth-login':'login.html', 'auth-register-owner':'login.html#register',
    'owner-rooms-list':'owner-listings.html', 'owner-create-wizard':'owner-create.html',
    'owner-edit-room':'owner-edit.html', 'owner-bookings':'owner-viewings.html',
    'owner-profile':'owner-profile.html', 'owner-preview':'owner-preview.html',
    'owner-booking-detail':'owner-viewings.html', 'admin-approval-detail':'admin-review.html',
    'admin-owners-list':'admin-owners.html', 'admin-owner-detail':'admin-owners.html',
    'error-403':'403.html', 'error-404':'404.html',
  };
  const missing = {
    'tenant-list':'Tìm phòng', 'tenant-map':'Bản đồ', 'room-detail':'Chi tiết phòng công khai',
    'ai-assistant':'Trợ lý AI', 'auth-admin':'Đăng nhập Admin riêng',
    'owner-overview':'Dashboard chủ trọ', 'admin-overview':'Dashboard Admin',
    'admin-approvals':'Danh sách chờ duyệt',
  };
  let dialog;
  function getDialog() {
    if (dialog) return dialog;
    dialog = document.createElement('dialog');
    dialog.id = 'sh-ui-dialog';
    dialog.setAttribute('aria-labelledby','sh-ui-dialog-title');
    dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
    document.body.appendChild(dialog);
    return dialog;
  }
  function showDialog(title, message, withScreens = false) {
    const d = getDialog();
    d.replaceChildren();
    const heading = document.createElement('h2');
    heading.id = 'sh-ui-dialog-title';heading.textContent = title;d.appendChild(heading);
    const text = document.createElement('p');text.textContent = message;d.appendChild(text);
    if (withScreens) {
      const grid = document.createElement('div');grid.className='sh-grid';
      for (const p of pages) {
        const a=document.createElement('a');a.href=p.file;a.textContent=`${p.code} · ${p.title}`;
        if (p.file===current) a.setAttribute('aria-current','page');
        grid.appendChild(a);
      }
      d.appendChild(grid);
    }
    const caption=document.createElement('p');caption.className='sh-caption';
    caption.textContent='Bản thử giao diện: không lưu dữ liệu hoặc thực hiện dịch vụ thật.';d.appendChild(caption);
    const foot=document.createElement('div');foot.className='sh-foot';
    const hub=document.createElement('a');hub.href='start.html';hub.textContent='Về mục lục';foot.appendChild(hub);
    const close=document.createElement('button');close.type='button';close.className='sh-primary';close.textContent='Đóng';
    close.addEventListener('click',()=>d.close());foot.appendChild(close);d.appendChild(foot);
    if (!d.open) d.showModal();
    close.focus();
  }
  function unavailable(name) {
    showDialog('Chưa có màn hình này trong ZIP',`${name} chưa có bản xuất HTML tương ứng. Bạn có thể tiếp tục thử các màn hình đã có bên dưới.`,true);
  }
  function go(target) {
    if (routes[target]) target=routes[target];
    if (available.has(target.split('#')[0])) { location.href=target;return; }
    unavailable(missing[target] || target);
  }
  function label(el) {
    const copy=el.cloneNode(true);
    copy.querySelectorAll('.material-symbols-outlined,.material-icons,svg').forEach(n=>n.remove());
    return copy.textContent.replace(/\s+/g,' ').trim();
  }
  function destination(text) {
    if (/^(S:HOMEs|SS:HOMEs)$/.test(text)) return 'index.html';
    if (/ma trận 25|demo index|danh mục 25|đổi vai trò/i.test(text)) return 'start.html';
    if (/đăng xuất|đăng nhập quản trị|cổng quản trị viên/i.test(text)) return 'login.html';
    if (/^đăng nhập$/.test(text.toLowerCase())) return 'login.html';
    if (/đăng tin cho thuê|bắt đầu đăng tin|đăng tin phòng trọ|đăng phòng mới|đăng tin mới/i.test(text)) return 'owner-create.html';
    if (/tin đăng của tôi|danh sách phòng|^quản lý$|^chủ trọ$|chủ trọ demo/i.test(text)) return 'owner-listings.html';
    if (/lịch hẹn xem phòng|xử lý 02 yêu cầu/i.test(text)) return 'owner-viewings.html';
    if (/hồ sơ chủ trọ/i.test(text)) return 'owner-profile.html';
    if (/danh sách chủ trọ|^quản trị admin$|^super admin$|^admin$/i.test(text)) return 'admin-owners.html';
    if (/xem hồ sơ kiểm duyệt/i.test(text)) return 'admin-review.html';
    if (/xem quản lý|xem hồ sơ gửi|xem tin hiển thị/i.test(text)) return 'owner-preview.html';
    if (/sửa nội dung|sửa & gửi lại|tôi hiểu, tiếp tục sửa/i.test(text)) return 'owner-edit.html';
    if (/so sánh phòng|mở bảng so sánh|so sánh danh sách/i.test(text)) return 'compare.html';
    if (/tiếp tục tìm phòng với vai trò khách|giao diện khách thuê|trang chủ/i.test(text)) return 'index.html';
    if (/kiểm duyệt tin/i.test(text)) return 'admin-approvals';
    if (/tổng quan|bảng điều khiển chủ trọ/i.test(text)) return current.startsWith('admin-')?'admin-overview':'owner-overview';
    if (/bản đồ/i.test(text)) return 'tenant-map';
    if (/trợ lý ai|ai tư vấn/i.test(text)) return 'ai-assistant';
    if (/xem như khách thuê|^chi tiết$|^chi tiết\s|xem chi tiết|xem ngay/i.test(text)) return 'room-detail';
    if (/tìm phòng|tìm kiếm ngay|xem tất cả 12|^\d+\+ phòng|^hot focus/i.test(text)) return 'tenant-list';
    return null;
  }
  function bind(el,target) {
    el.removeAttribute('onclick');
    if (el.tagName==='A') el.setAttribute('href', available.has(target.split('#')[0])?target:'#');
    el.addEventListener('click',event=>{event.preventDefault();event.stopImmediatePropagation();go(target);},true);
  }
  function init() {
    const bar=document.createElement('nav');bar.id='sh-ui-bar';bar.setAttribute('aria-label','Điều hướng bản thử giao diện');
    bar.innerHTML='<span class="sh-label">S:HOMEs · UI demo</span><button type="button" id="sh-ui-screens">Màn hình</button><a href="index.html">Trang chủ</a><a href="owner-listings.html">Chủ trọ</a><a href="admin-owners.html">Admin</a>';
    document.body.appendChild(bar);
    document.getElementById('sh-ui-screens').addEventListener('click',()=>showDialog('Các màn hình có sẵn','Chọn một màn hình để thử giao diện.',true));
    for (const el of document.querySelectorAll('a,button')) {
      if (el.closest('#sh-ui-bar')) continue;
      const text=label(el);
      // Preserve existing tabs, dialogs, calculators, forms and their listeners.
      const existing=el.getAttribute('onclick');
      if (el.tagName==='BUTTON' && (existing || el.id)) continue;
      let target=destination(text);
      if (target) { bind(el,target);continue; }
      if (el.tagName==='A') {
        const href=el.getAttribute('href') || '#';
        if (/^\/(chu-tro|admin|demo-01|phong)/.test(href)) {
          if (/chinh-sua|\/sua/.test(href)) target='owner-edit.html';
          else if (/lich-hen|lich-xem/.test(href)) target='owner-viewings.html';
          else if (/^\/phong/.test(href)) target='room-detail';
          else if (/demo-01/.test(href)) target='start.html';
          else target='owner-listings.html';
          bind(el,target);
        } else if (href==='/' || href==='javascript:void(0)') bind(el,'index.html');
        else if (href==='#' || /^\/(lien-he)/.test(href) || /^(tel:|mailto:)/.test(href)) {
          el.removeAttribute('onclick');
          el.addEventListener('click',e=>{e.preventDefault();showDialog('Phần minh họa',`${text || 'Chức năng này'} chưa được triển khai trong bản thử giao diện.`);});
        }
      }
    }
    // Existing matrix cards now navigate to real local HTML files.
    window.navigateTo=go;
    document.querySelectorAll('[onclick^="navigateTo("]').forEach(el=>{
      el.setAttribute('role','link');el.tabIndex=0;
      el.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();el.click();}});
    });
    window.alert=message=>showDialog('Thông báo minh họa',String(message));
    if (current==='login.html') {
      window.handleLoginSubmit=event=>{
        event.preventDefault();
        const email=document.getElementById('login-email').value.trim().toLowerCase();
        go(email==='admin@shomes.test'?'admin-owners.html':'owner-listings.html');
      };
      if (location.hash==='#register') window.switchAuthTab?.('register');
    }
    if (current==='demo.html') {
      window.runScenario=flow=>{
        const targets={'flow-1':'compare.html','flow-2':'ai-assistant','flow-3':'owner-create.html','flow-4':'login.html'};
        go(targets[flow] || 'start.html');
      };
    }
    if (current==='403.html') window.switchRoleMock=role=>go(role==='admin'?'admin-owners.html':role==='landlord'?'owner-listings.html':'index.html');
    window.quickCall=()=>showDialog('Cuộc gọi minh họa','Bản thử UI không gọi tới số điện thoại mẫu.');
    document.querySelectorAll('button').forEach(el=>{
      if(el.closest('#sh-ui-bar') || el.hasAttribute('onclick') || el.id) return;
      const text=label(el);
      if (/^(khách|chủ trọ [ab]|admin)$/i.test(text)) bind(el,/^khách$/i.test(text)?'index.html':/^admin$/i.test(text)?'admin-owners.html':'owner-listings.html');
      else if(text==='edit') bind(el,'owner-edit.html');
      else if(/lưu bản nháp/i.test(text)) el.addEventListener('click',()=>showDialog('Lưu bản nháp minh họa','Bạn đã thử thao tác lưu. Bản UI này chưa lưu dữ liệu sau khi chuyển trang hoặc tải lại.'));
      else if(/quay lại bước 1/i.test(text)) el.addEventListener('click',()=>unavailable('Bước 1 của wizard sửa tin'));
    });
    // Creating a listing was exported only at step 3; do not pretend missing steps exist.
    if(current==='owner-create.html') {
      document.querySelectorAll('a').forEach(el=>{
        const t=label(el);
        if(/bước [24]/i.test(t)) el.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();unavailable(t);},true);
      });
    }
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init);else init();
})();
