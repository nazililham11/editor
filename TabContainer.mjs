import { appendStyle, ObjLength } from './utils.mjs'

export function TabConainer() {

    let container, tabContent, tabButtons
    function render(parentEl = document.body){
        parentEl = parentEl || document.body

        container = document.createElement('div')
        container.setAttribute('class', 'tab-container')
        
        tabContent = document.createElement('div')
        tabContent.setAttribute('class', 'tab-content')

        tabButtons = document.createElement('div')
        tabButtons.setAttribute('class', 'tab-buttons')

        container.append(tabContent)
        container.append(tabButtons)

        parentEl.append(container)
    }


    let tabs = {}
    let tabId = 0
    let activeId = -1
    function create(title) {
        const id = tabId
        
        const button = document.createElement('div')
        button.setAttribute('class', 'btn-tab')
        button.innerText = title
        button.onclick = () => open(id)
        tabButtons.append(button)
        
        const body = document.createElement('div')
        body.setAttribute('class', 'tab-body')
        tabContent.append(body)
        
        let onOpen = function(){}
        let onExit = function(){}
        function on(eventKey, callback){
            if (eventKey === 'open') onOpen = callback 
            else if (eventKey === 'exit') onExit = callback
        }

        const tabData = { 
            id, title, button, body, on, 
            onOpen: () => onOpen(), 
            onExit: () => onExit(),
            open: () => open(id)
        }  

        tabs[id] = tabData
        tabId += 1

        return tabData
    }

    function get(id){
        return tabs[id]
    }

    function open(id){
        for (const _id in tabs){
            tabs[_id].button.classList.toggle('active', _id == id)
            tabs[_id].body.classList.toggle('active', _id == id)

            if (_id == id){
                tabs[_id].onOpen()
            } else if (_id == activeId){
                tabs[_id].onExit()
            }
        }
        activeId = id
    }

    function length(){
        return Object.keys(tabs).length
    }
    
    const styles = `
        .tab-container {
            display: flex;
            flex-direction: row;
            min-height: 100vh;
        }
        .tab-buttons {
            width: fit-content;
            background-color: var(--bg-darker-color, hsl(200, 19%, 8%));
            display: flex;
            flex-direction: column;
        }
        .btn-tab {
            padding: .75rem .25rem;
            color: var(--fg-color, white);
            font-size: small;
            writing-mode: tb-rl;
            border-right: 2px solid transparent;
            cursor: pointer;
        }
        .btn-tab.active {
            background-color: var(--bg-color, hsl(200, 19%, 10%));
            border-right: 2px solid var(--primary-color, red);
        }
        .btn-tab:hover          { opacity: .8; }
        .tab-content            { flex: 1 1 auto!important; }
        .tab-body               { width: 100%; height: 100% }
        .tab-body:not(.active)  { display: none }
        .tab-body:not(.active) > div { display: none }
    `
    appendStyle(styles)

    return {
        tabs, activeId, render, create, get, open, length
    }
    
}