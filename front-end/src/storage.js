let owner='';
export function setStorageOwner(id=''){owner=id;}
const scoped=key=>owner?`aster-account:${owner}:${key}`:key;
export const storage={
 getItem(key){return window.localStorage.getItem(scoped(key));},
 setItem(key,value){window.localStorage.setItem(scoped(key),value);if(owner)window.dispatchEvent(new Event('aster-storage'));},
 removeItem(key){window.localStorage.removeItem(scoped(key));if(owner)window.dispatchEvent(new Event('aster-storage'));}
};
export function snapshotStorage(){const data={};const prefix=`aster-account:${owner}:`;for(let i=0;i<window.localStorage.length;i++){const key=window.localStorage.key(i);if(owner&&key.startsWith(prefix))data[key.slice(prefix.length)]=window.localStorage.getItem(key);}return data;}
export function restoreStorage(id,data){setStorageOwner(id);const prefix=`aster-account:${id}:`;Object.keys(window.localStorage).filter(k=>k.startsWith(prefix)).forEach(k=>window.localStorage.removeItem(k));for(const [key,value]of Object.entries(data||{})){if(typeof value==='string'&&/^(aster-|dinostudy-)/.test(key))window.localStorage.setItem(prefix+key,value);}}
