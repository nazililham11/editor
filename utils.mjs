
// https://gist.github.com/josephm28/d3b19c906aee7a268dd28d71215427d1
export function loadExternal(url, timeout = 5000) {
    return new Promise((resolve, reject) => {

        // https://stackoverflow.com/questions/32461271/nodejs-timeout-a-promise-if-failed-to-complete-in-time
        const timer = setTimeout(() => {
            reject(new Error(`load ${url.split('/').pop()} timed out after ${timeout} ms`))
        }, timeout)

        const onLoadCallback = (e) => {
            clearTimeout(timer)
            resolve(e)
        }
        const onErrorCallback = (e) => {
            clearTimeout(timer)
            reject(e)
        }

        if (url.endsWith('.css')){
            const exists = document.querySelector(`link[href="${url}"]`)
            if (exists) return onLoadCallback(exists)
            
            const el = document.createElement('link')
            el.setAttribute('type', 'text/css')
            el.setAttribute('rel', 'stylesheet')
            el.setAttribute('href', url)
            el.onload = onLoadCallback
            el.onerror = onErrorCallback
            
            document.head.appendChild(el)
            
        } else if (url.endsWith('.js')){
            const exists = document.querySelector(`script[src="${url}"]`)
            if (exists) return onLoadCallback(exists)
            
            const el = document.createElement('script')
            el.setAttribute('defer', '')
            el.setAttribute('src', url)
            el.onload = onLoadCallback
            el.onerror = onErrorCallback
            
            document.body.appendChild(el)
        }
    })
}
export function appendStyle(styleStr) {
    const style = document.createElement('style')
    style.innerHTML = sanitaizeWhitespaces(styleStr)
    document.head.appendChild(style)
}
export function sanitaizeWhitespaces(text){
    let min_spaces = Infinity

    for (const line of String(text).split('\n')){
        if (line.trim().length < 1) continue
        let index = 0
        while (index < line.length && /\s/.test(line.charAt(index))) index++
        min_spaces = Math.min(min_spaces, index)
    }
    
    if (min_spaces < 1 || !isFinite(min_spaces)) return text
    
    return String(text).split('\n')
        .map(line => (line.slice(min_spaces)))
        .join('\n').trim()
}

export function isMobileBrowser(){
    const phones = [
        'phone', 'pad', 'pod', 'iPhone', 'iPod', 'ios', 'iPad', 'Android', 
        'Mobile', 'BlackBerry', 'IEMobile', 'MQQBrowser', 'JUC', 'Fennec', 
        'wOSBrowser', 'BrowserNG', 'WebOS', 'Symbian', 'Windows Phone', 
    ]
    for (const phone of phones){
        if (navigator.userAgent.indexOf(phone) > -1) return true
    }
    return false
}
export async function loadTxtList(url){
    return await fetch(url).then(data => data.text()).then(text => txtToList(text))
}
export function txtToList(txt){
    return txt.split('\n')
        .map(x => x.replaceAll('\r', '').trim())
        .filter(x => x.length > 0)
}
export function ObjLength(object){
    return Object.keys(object).length
}
export default { 
    loadExternal, appendStyle, sanitaizeWhitespaces, 
    isMobileBrowser, loadTxtList, txtToList, ObjLength
}