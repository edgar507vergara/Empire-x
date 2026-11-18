'use client';
import { useEffect,useId,useRef } from 'react';
import { X } from 'lucide-react';
export default function Modal({title,onClose,children}:{title:string;onClose:()=>void;children:React.ReactNode}){
  const id=useId(),ref=useRef<HTMLDivElement>(null),closeRef=useRef(onClose);closeRef.current=onClose;
  useEffect(()=>{const previous=document.activeElement as HTMLElement|null;const box=ref.current;box?.querySelector<HTMLElement>('button,input,select,a[href]')?.focus();const key=(e:KeyboardEvent)=>{if(e.key==='Escape')closeRef.current();if(e.key==='Tab'){const list=box?.querySelectorAll<HTMLElement>('button:not(:disabled),input,select,a[href],[tabindex="0"]');if(!list?.length)return;const first=list[0],last=list[list.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}};document.addEventListener('keydown',key);return()=>{document.removeEventListener('keydown',key);previous?.focus();};},[]);
  return <div className="modal-scrim" onClick={onClose}><div ref={ref} className="modal" role="dialog" aria-modal="true" aria-labelledby={id} onClick={e=>e.stopPropagation()}><div className="modal-title"><h2 id={id}>{title}</h2><button className="icon-btn" onClick={onClose} aria-label="Cerrar"><X size={20}/></button></div>{children}</div></div>;
}
