(async function(){
    
    const Utils            = await import('./utils.mjs')
    const { Editor }       = await import('./Editor.mjs')
    const { Firebase }     = await import('./Firebase.mjs')
    const { Spinner }      = await import('./Spinner.mjs')
    const { TabConainer }  = await import('./TabContainer.mjs')
    
    const FIREBASE_CONFIG = {
        apiKey: "",
        authDomain: "",
        databaseURL: "",
        projectId: "",
        storageBucket: "",
        messagingSenderId: "",
        appId: "",
    }
    const FIREBASE_APP_PATH = 'editor/'

    const DEFAULT_TAB_CONFIG = {
        title: 'Untitled',
        editor: { 
            mode: 'text/javascript',
            lineNumbers: true,
            styleActiveLine: true,
            lineWrapping: true,
            minLines: 100,
            viewportMargin: 100,
            keyMap: 'sublime',
            theme: 'dracula',
            addons: [
                'https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/keymap/sublime.min.js',
                'https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/theme/dracula.min.css',
                'https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/addon/search/searchcursor.min.js',
                'https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/addon/hint/show-hint.min.css',
                'https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/addon/hint/show-hint.min.js',

                'https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/mode/javascript/javascript.min.js',
                'https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/addon/lint/javascript-lint.min.js',
                'https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/addon/hint/javascript-hint.min.js',
            ]
        },
    }
    
    async function main(){

        const spinner = Spinner()
        spinner.render()
        spinner.show()

        const tabContainer = TabConainer()
        tabContainer.render()


        const firebase = await Firebase(FIREBASE_CONFIG, FIREBASE_APP_PATH)
        if (!firebase) return


        function createTab(config){
            config = { ...DEFAULT_TAB_CONFIG, ...(config ?? {}) }
            
            const tab = tabContainer.create(config.title ?? 'Untitled')
            const editor = Editor(config.editor)

            function onChange(data) {
                if (editor.getCodemirror()){
                    editor.getCodemirror().setValue(data ?? '')
                }
            }

            const data = firebase.initData(config.store.path, { onChange })
            
            function save(){
                if (!data) return
                if (!editor.getCodemirror()) return
                data.set(editor.getCodemirror().getValue() + '')
                console.log('saved', config.title)
            }

            tab.on('open', async () => {
                if (!editor.getCodemirror()){
                    await editor.render(tab.body)
                    editor.getCodemirror().addKeyMap({ 'Ctrl-S': save })
                    editor.getCodemirror().setValue(data.get() ?? '')
                    
                    console.log('rendering', config.title)
                }
                editor.getCodemirror().refresh()
                editor.getCodemirror().focus()
            })

            tab.on('exit', () => {
                editor.getCodemirror().refresh()
            })
            
            

            if (tabContainer.length() == 1) tab.open()

            return { tab, editor, data, save }
        }

        
        createTab({ title: 'Editor 1', store: { path: 'editor1' } })
        createTab({ title: 'Editor 2', store: { path: 'editor2' } })
        createTab({ title: 'Editor 3', store: { path: 'editor3' } })
        createTab({ title: 'Editor 4', store: { path: 'editor4' } })
        

        spinner.hide()
        
    }

    Utils.appendStyle(`
        :root {
            font-family: Consolas;
            --bg-color          : hsl(200, 19%, 18%);
            --bg-darker-color   : hsl(200, 19%, 8%);
            --fg-color          : hsl(0, 0%, 80%);
            --fg-muted-color    : hsl(0, 0%, 65%);
            --primary-color     : hsl(14, 100%, 50%);
            --secondary-color   : hsl(14, 100%, 28%);
        }
        body { 
            min-height: 100vh; 
            margin: 0; 
            background-color: var(--bg-color);
        }
        .CodeMirror { 
            height: 100% !important; 
        }
    `)


    main()
})()