/* NEWLOOK SaaS Unified Action System V2 - non-invasive */
(() => {
  'use strict';
  const text = el => (el?.innerText || el?.textContent || el?.value || '').replace(/\s+/g,' ').trim();
  const dangerWords = /\b(delete|remove|destroy|terminate|suspend|deactivate|finalize|mark as paid|reset password)\b/i;
  const warningWords = /\b(reopen|cancel|reject|decline|disable)\b/i;
  const successWords = /\b(save|create|add|approve|activate|confirm|clock in|clock out|check in|check out|start|complete|calculate|generate|export|print|assign|register|update|process)\b/i;
  const primaryWords = /\b(create|add|save|process|calculate|generate|submit|continue|activate|approve|finalize|clock in|clock out|start patrol|send panic)\b/i;

  function toast(message,type='info'){
    let box=document.getElementById('newlook-action-toast');
    if(!box){box=document.createElement('div');box.id='newlook-action-toast';box.className='newlook-action-toast';document.body.appendChild(box);}
    box.className=`newlook-action-toast is-${type}`;box.textContent=message;
    requestAnimationFrame(()=>box.classList.add('show')); clearTimeout(box._timer);
    box._timer=setTimeout(()=>box.classList.remove('show'),3200);
  }
  function setLoading(button,on=true,label='Processing...'){
    if(!button)return;
    if(on){if(!button.dataset.originalLabel)button.dataset.originalLabel=button.innerHTML;button.disabled=true;button.classList.add('is-loading');button.innerHTML=`<span class="action-spinner" aria-hidden="true"></span><span>${label}</span>`;}
    else{button.disabled=false;button.classList.remove('is-loading');if(button.dataset.originalLabel)button.innerHTML=button.dataset.originalLabel;}
  }
  function confirmAction(button,message){
    return new Promise(resolve=>{
      const overlay=document.createElement('div');overlay.className='nl-action-confirm';
      overlay.innerHTML=`<div class="nl-action-dialog" role="dialog" aria-modal="true">
        <div class="nl-action-icon">!</div><h3>Confirm action</h3><p></p>
        <div class="nl-action-dialog-actions"><button type="button" class="action-btn action-btn-secondary" data-cancel>Cancel</button><button type="button" class="action-btn action-btn-danger" data-ok>Continue</button></div></div>`;
      overlay.querySelector('p').textContent=message;document.body.appendChild(overlay);
      const finish=v=>{overlay.remove();resolve(v)};overlay.querySelector('[data-cancel]').onclick=()=>finish(false);overlay.querySelector('[data-ok]').onclick=()=>finish(true);
      overlay.onclick=e=>{if(e.target===overlay)finish(false)};overlay.querySelector('[data-ok]').focus();
    });
  }
  function classify(button){
    if(!button || button.dataset.nlClassified==='1')return;
    button.dataset.nlClassified='1';button.classList.add('action-btn');
    const label=text(button);
    if(dangerWords.test(label))button.classList.add('action-btn-danger');
    else if(warningWords.test(label))button.classList.add('action-btn-warning');
    else if(successWords.test(label))button.classList.add(primaryWords.test(label)?'action-btn-primary':'action-btn-success');
    else button.classList.add('action-btn-secondary');
  }
  function enhance(root=document){root.querySelectorAll?.('button,input[type="button"],input[type="submit"],[role="button"]').forEach(classify)}
  document.addEventListener('click',async e=>{
    const b=e.target.closest?.('button,input[type="button"],input[type="submit"],[role="button"]');
    if(!b||b.disabled||b.dataset.nlConfirming==='1'||b.dataset.nlConfirmed==='1'||b.dataset.noConfirm==='true')return;
    const label=text(b);if(!dangerWords.test(label))return;
    e.preventDefault();e.stopImmediatePropagation();b.dataset.nlConfirming='1';
    const ok=await confirmAction(b,`${label} is a sensitive action. Please confirm before continuing.`);
    delete b.dataset.nlConfirming;if(ok){b.dataset.nlConfirmed='1';b.click();setTimeout(()=>delete b.dataset.nlConfirmed,0)}
  },true);
  document.addEventListener('DOMContentLoaded',()=>{enhance();new MutationObserver(ms=>ms.forEach(m=>m.addedNodes.forEach(n=>{if(n.nodeType===1)enhance(n)}))).observe(document.body,{childList:true,subtree:true})});
  window.NEWLOOK_ACTIONS={toast,setLoading,confirmAction,enhance};
})();