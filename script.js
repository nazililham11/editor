(async function(){
    
    const Utils            = await import('./utils.mjs')
    const { Editor }       = await import('./Editor.mjs')
    const { Firebase }     = await import('./Firebase.mjs')
    const { Spinner }      = await import('./Spinner.mjs')
    const { TabConainer }  = await import('./TabContainer.mjs')

    const FIREBASE_CONFIG   = JSON.parse(localStorage.getItem('firebase') ?? '{}')
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
                'https://cdnjs.cloudflare.com/ajax/libs/codemirror/6.65.7/keymap/sublime.min.js',
                'https://cdnjs.cloudflare.com/ajax/libs/codemirror/6.65.7/theme/dracula.min.css',
                'https://cdnjs.cloudflare.com/ajax/libs/codemirror/6.65.7/addon/search/searchcursor.min.js',
                'https://cdnjs.cloudflare.com/ajax/libs/codemirror/6.65.7/addon/hint/show-hint.min.css',
                'https://cdnjs.cloudflare.com/ajax/libs/codemirror/6.65.7/addon/hint/show-hint.min.js',

                'https://cdnjs.cloudflare.com/ajax/libs/codemirror/6.65.7/mode/markdown/markdown.min.js',
                'https://cdnjs.cloudflare.com/ajax/libs/codemirror/6.65.7/mode/javascript/javascript.min.js',
                'https://cdnjs.cloudflare.com/ajax/libs/codemirror/6.65.7/addon/lint/javascript-lint.min.js',
                'https://cdnjs.cloudflare.com/ajax/libs/codemirror/6.65.7/addon/hint/javascript-hint.min.js',
            ]
        },
    }
    
    async function main(){
        
        // 
        // Init UI stuff
        // 
        const spinner = Spinner()
        spinner.render()
        spinner.show()

        const tabContainer = TabConainer()
        tabContainer.render()


        // 
        // Firebase
        // 
        const firebase = await Firebase(FIREBASE_CONFIG, FIREBASE_APP_PATH)
        if (!firebase) {
            alert('Failed to connect to firebase.\nThis App need Firebase to run')
            
            createSettingTab()
            spinner.hide()
            return
        }


        // 
        // Create Tabs
        // 
        function createSettingTab(){
            const settingsTab = tabContainer.create('Settings')
            const body = Setting(settingsTab.body)

            if (tabContainer.length() == 1){
                settingsTab.open()
            }

            return { tab: settingsTab, body }
        }
        function createEditorTab(config){
            const title = config.title ?? 'Untitled'

            const tab = tabContainer.create(title)
            const editor = Editor({ 
                ...(DEFAULT_TAB_CONFIG.editor ?? {}), 
                ...(config.editor ?? {}),
                addons: [
                    ...(DEFAULT_TAB_CONFIG.editor.addons), 
                    ...(config?.editor?.addons ?? [])
                ]
            })
            
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

            return { tab, editor, data, title, config, save }
        }

        const tabs = [
            createEditorTab({ title: 'Editor 1', store: { path: 'editor1' } }),
            createEditorTab({ 
                title: 'Editor 2', 
                editor: { mode: 'text/markdown' }, 
                store: { path: 'editor2' } 
            }),
            createEditorTab({ title: 'Editor 3', store: { path: 'editor3' } }),
            createEditorTab({ title: 'Editor 4', store: { path: 'editor4' } }),
        ]
        
        const setting = createSettingTab()
        setting.body.append(document.createElement('br'))
        
        for (const tab of tabs){
            const button = document.createElement('button')
            button.innerHTML = 'Save ' + tab.title
            button.onclick = () => tab.save()
            
            setting.body.append(button)
            setting.body.append(document.createElement('br'))
        }
       
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

    // 
    // Experimental
    // 
    function Setting(parent = document.body){
        
        const style = `
        .setting {
            padding: 2rem;
            display: grid;
            color: var(--fg-color);
        }
        `
        Utils.appendStyle(style)

        
        const container = document.createElement('div')
        container.setAttribute('class', 'setting')
        
        const importFbCredBtn = document.createElement('button')
        importFbCredBtn.innerHTML = 'Import Cred (.json)'
        importFbCredBtn.onclick = () => {
            Utils.inputFile((data) => {
                const fbCred = JSON.parse(data)
                localStorage.setItem('firebase', JSON.stringify(fbCred))
                console.log('loaded firebase cred,', fbCred)
                location.reload()
            }, '.json')
        }
        container.append(importFbCredBtn)


        const fbCredStatus = document.createElement('span')
        fbCredStatus.innerHTML = 'Firebase Credentials : '
        fbCredStatus.innerHTML += Object.keys(FIREBASE_CONFIG).length ? 'Installed':'Not Found'
        container.append(fbCredStatus)
        
        
        parent.append(container)


        return container
        
    }

    main()
})()