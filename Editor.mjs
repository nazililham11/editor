import { loadExternal, isMobileBrowser } from './utils.mjs'

export function Editor(config){

    const CM_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/codemirror/6.65.7/'
    const isMobile = isMobileBrowser()
    
    let addons = [
        CM_CDN + 'addon/hint/show-hint.min.css',
        CM_CDN + 'addon/hint/show-hint.min.js',
        CM_CDN + 'addon/search/searchcursor.min.js',
        ...(config.addons ?? [])
    ]

    let codemirror, hints, limit
    let libsLoaded = loadLibs()

    const defaultConfig = {
        lineNumbers: true,
        indentUnit: 4,
        extraKeys: { 
            'Alt-Up': 'swapLineUp',
            'Alt-Down': 'swapLineDown',
        },
        styleActiveLine: true,
        lineWrapping: true,
        minLines: 50,
        viewportMargin: 50
    }

    if (config.addons){
        delete config.addons
    }
    
    config = { ...defaultConfig,  ...(config ?? {}) }
    
    async function render(element){
        
        await libsLoaded

        if (element.type === 'textarea'){
            codemirror = CodeMirror.fromTextArea(element, config)
        } else {
            const textarea = document.createElement('textarea')
            element.append(textarea)
            codemirror = CodeMirror.fromTextArea(textarea, config)
        }    
    }

    function loadLibs(){
        return new Promise((resolve) => {
            Promise.all([
                loadExternal(CM_CDN + 'codemirror.min.js'),
                loadExternal(CM_CDN + 'codemirror.min.css'),
            ])
            const cmScan = setInterval(() => {
                if (typeof CodeMirror === 'undefined') return
                
                clearInterval(cmScan)
                const libs = addons.map(lib => loadExternal(lib))
                Promise.all(libs).then(() => resolve(true))
            }, 1)

        })
    }

    // https://stackoverflow.com/questions/32165851/how-to-enable-code-hinting-using-codemirror
    function showHints(){
        if (!hints || hints.length < 1) return

        CodeMirror.showHint(codemirror, () => {

            let cursor = codemirror.getCursor()
            let line = codemirror.getLine(cursor.line)
            let start = cursor.ch, end = cursor.ch

            while (start > 0 && /\w/.test(line.charAt(start - 1))) --start
            while (end < line.length && /\w/.test(line.charAt(end))) ++end

            const word = line.substring(start, end)
            const list = hints.filter(item => (
                    item.replaceAll(' ', '').indexOf(word) >= 0
                ))
                .sort((a, b) => {
                    const a_nospace = a.replaceAll(' ', '')
                    const b_nospace = b.replaceAll(' ', '')

                    // Exact check
                    if (b === word) return 4
                    if (a === word) return -4

                    // Same character start
                    if (b_nospace.startsWith(word)) return 3
                    if (a_nospace.startsWith(word)) return -3

                    // Has exact word
                    if (b.split(' ').indexOf(word) > -1) return 2
                    if (a.split(' ').indexOf(word) > -1) return -2

                    // Include word
                    if (b_nospace.indexOf(word) > -1) return 1
                    if (a_nospace.indexOf(word) > -1) return -1

                    // Nothing match
                    return 0
                }).slice(0, limit)

            return { 
                list: list,
                from: CodeMirror.Pos(cursor.line, start),
                to: CodeMirror.Pos(cursor.line, end)
            }
        })
    }

    function useHints(newHints, newLimit = 100){
        
        if (!hints) {            
            let style = `.CodeMirror-hints { z-index: 100!important; }`

            if (isMobile){
                style += `
                    .CodeMirror-hint {
                        padding-top: 1ch;
                        padding-bottom: 1ch;
                        border-bottom: 1px solid black;    
                    }
                `
                codemirror.on('change', (editor, changes) => {
                    const key = changes.text?.pop()
                    if (changes.origin !== '+input') return
                    if (editor.state.completionActive) return 
                    if (key.toString().trim().length !== 1) return
                        
                    showHints()
                })

            } else {
                // https://stackoverflow.com/questions/13744176/codemirror-autocomplete-after-any-keyup
                codemirror.on('keyup', (editor, event) => {    
                    if (editor.state.completionActive) return 
                    if (event.key.toString().trim().length !== 1) return

                    showHints()
                })
            }

            codemirror.addKeyMap({
                'Ctrl-Space': () => showHints()
            })

            styles(style)
        }

        hints = newHints
        limit = newLimit
    }

    function getCodemirror(){
        return codemirror
    }

    return {
        getCodemirror, showHints, useHints, loadLibs, render
    }
}