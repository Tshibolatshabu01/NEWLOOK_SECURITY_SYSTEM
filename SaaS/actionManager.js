/* NEWLOOK SaaS Unified Enterprise Action System V3
 * Non-invasive: preserves existing handlers and business logic.
 * Adds consistent action semantics, colors, loading state, safe optional confirmation,
 * and a Copy action for data-table rows. Backend duplication/deletion remains owned by each module.
 */
(() => {
  'use strict';
  const text = el => (el?.innerText || el?.textContent || el?.value || '').replace(/\s+/g,' ').trim();
  const normalize = value => String(value || '').toLowerCase().replace(/\s+/g,' ').trim();

  const rules = [
    ['danger', /^(delete|remove|destroy|terminate|permanently delete|revoke|reject|decline|send panic|emergency|suspend)$/i],
    ['warning', /^(cancel|disable|deactivate|archive|lock|unlock|reopen|escalate|reset)$/i],
    ['purple', /^(copy|duplicate|clone|reassign|schedule)$/i],
    ['teal', /^(export|download|sync|refresh|acknowledge)$/i],
    ['orange', /^(edit|update|modify|correct|adjust)$/i],
    ['success', /^(save|create|add|approve|activate|restore|confirm|check in|check out|clock in|clock out|start|complete|calculate|generate|assign|register|process|send|submit)$/i],
    ['primary', /^(continue|view|open|details|search|filter|qr|scan|print)$/i]
  ];

  function actionKey(label){
    const value = normalize(label).replace(/^[+•→←✓×]+\s*/, '');
    for (const [key, regex] of rules) if (regex.test(value)) return key;
    if (/\b(delete|remove|destroy|terminate|revoke)\b/i.test(value)) return 'danger';
    if (/\b(edit|update|modify|correct)\b/i.test(value)) return 'orange';
    if (/\b(copy|duplicate|clone|reassign)\b/i.test(value)) return 'purple';
    if (/\b(export|download|refresh|sync)\b/i.test(value)) return 'teal';
    if (/\b(cancel|disable|deactivate|archive|lock|unlock|reject|escalate)\b/i.test(value)) return 'warning';
    if (/\b(save|create|add|approve|activate|restore|confirm|assign|register|generate|calculate|process|send|submit)\b/i.test(value)) return 'success';
    if (/\b(view|open|search|filter|print|scan|qr)\b/i.test(value)) return 'primary';
    return 'secondary';
  }

  function toast(message,type='info'){
    let box=document.getElementById('newlook-action-toast');
    if(!box){box=document.createElement('div');box.id='newlook-action-toast';box.className='newlook-action-toast';document.body.appendChild(box);}
    box.className=`newlook-action-toast is-${type}`;box.textContent=message;
    requestAnimationFrame(()=>box.classList.add('show')); clearTimeout(box._timer);
    box._timer=setTimeout(()=>box.classList.remove('show'),3200);
  }

  function setLoading(button,on=true,label='Processing...'){
    if(!button)return;
    if(on){
      if(!button.dataset.originalLabel)button.dataset.originalLabel=button.innerHTML;
      button.disabled=true;button.classList.add('is-loading');
      button.innerHTML=`<span class="action-spinner" aria-hidden="true"></span><span>${label}</span>`;
    } else {
      button.disabled=false;button.classList.remove('is-loading');
      if(button.dataset.originalLabel)button.innerHTML=button.dataset.originalLabel;
    }
  }

  function confirmAction(button,message){
    return new Promise(resolve=>{
      const overlay=document.createElement('div');overlay.className='nl-action-confirm';
      overlay.innerHTML=`<div class="nl-action-dialog" role="dialog" aria-modal="true" aria-labelledby="nl-action-title">
        <div class="nl-action-icon">!</div><h3 id="nl-action-title">Confirm action</h3><p></p>
        <div class="nl-action-dialog-actions"><button type="button" class="action-btn action-btn-secondary" data-cancel>Cancel</button><button type="button" class="action-btn action-btn-danger" data-ok>Continue</button></div></div>`;
      overlay.querySelector('p').textContent=message;document.body.appendChild(overlay);
      const finish=v=>{overlay.remove();resolve(v)};
      overlay.querySelector('[data-cancel]').onclick=()=>finish(false);
      overlay.querySelector('[data-ok]').onclick=()=>finish(true);
      overlay.onclick=e=>{if(e.target===overlay)finish(false)};
      overlay.querySelector('[data-ok]').focus();
    });
  }

  function classify(button){
    if(!button || button.dataset.nlClassified==='1')return;
    button.dataset.nlClassified='1';button.classList.add('action-btn');
    const key=button.dataset.actionColor || actionKey(text(button));
    button.classList.add(`action-btn-${key}`);
    if(key==='danger')button.setAttribute('data-destructive','true');
  }

  function makeCopyButton(row){
    if(!row || row.dataset.noCopy==='true' || row.dataset.nlCopyAdded==='1') return;
    const actionCell = [...row.cells].find(cell => /\b(actions?|action)\b/i.test(cell.previousElementSibling?.textContent || '')) ||
      [...row.cells].find(cell => cell.querySelector('button,[role="button"],a'));
    if(!actionCell) return;
    const controls=actionCell.querySelectorAll('button,[role="button"]');
    if(!controls.length) return;
    if([...controls].some(b=>/^copy$/i.test(text(b)))) { row.dataset.nlCopyAdded='1'; return; }
    const copy=document.createElement('button');
    copy.type='button'; copy.className='action-btn action-btn-purple action-copy-row'; copy.textContent='Copy';
    copy.title='Copy this record summary';
    copy.addEventListener('click', async event=>{
      event.preventDefault();event.stopPropagation();
      const values=[...row.cells].filter(c=>c!==actionCell).map(c=>text(c)).filter(Boolean).join(' | ');
      try {
        await navigator.clipboard.writeText(values);
        toast('Record copied to clipboard','success');
      } catch {
        const area=document.createElement('textarea');area.value=values;area.style.position='fixed';area.style.opacity='0';document.body.appendChild(area);area.select();
        try { document.execCommand('copy'); toast('Record copied to clipboard','success'); } catch { toast('Copy is unavailable in this browser','error'); }
        area.remove();
      }
    });
    actionCell.append(' ',copy); row.dataset.nlCopyAdded='1';
  }

  function enhance(root=document){
    root.querySelectorAll?.('button,input[type="button"],input[type="submit"],[role="button"]').forEach(classify);
    root.querySelectorAll?.('table tbody tr').forEach(makeCopyButton);
  }

  // Optional generic confirmation. Modules can opt in with data-confirm-action="true".
  // Existing module confirmations are deliberately left untouched to avoid double prompts.
  document.addEventListener('click',async e=>{
    const b=e.target.closest?.('button,input[type="button"],input[type="submit"],[role="button"]');
    if(!b||b.disabled||b.dataset.nlConfirming==='1'||b.dataset.nlConfirmed==='1'||b.dataset.noConfirm==='true')return;
    if(b.dataset.confirmAction!=='true')return;
    e.preventDefault();e.stopImmediatePropagation();b.dataset.nlConfirming='1';
    const label=text(b)||'This action';
    const ok=await confirmAction(b,b.dataset.confirmMessage||`${label} is a sensitive action. Please confirm before continuing.`);
    delete b.dataset.nlConfirming;
    if(ok){b.dataset.nlConfirmed='1';b.click();setTimeout(()=>delete b.dataset.nlConfirmed,0)}
  },true);

  document.addEventListener('DOMContentLoaded',()=>{
    enhance();
    const observer=new MutationObserver(ms=>ms.forEach(m=>m.addedNodes.forEach(n=>{if(n.nodeType===1)enhance(n)})));
    if(document.body)observer.observe(document.body,{childList:true,subtree:true});
  });

  window.NEWLOOK_ACTIONS={toast,setLoading,confirmAction,enhance,classify,actionKey};
})();
