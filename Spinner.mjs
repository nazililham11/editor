import { appendStyle } from './utils.mjs'

export function Spinner(){
    
    let container
    
    function render(parentEl = document.body){
        container = document.createElement('div')
        container.setAttribute('class', 'loader-container')
        container.innerHTML = '<span class="loader"></span>'
        parentEl.append(container)
    }
            
    function show(){
        container.classList.toggle('hidden', false)
    }
    function hide(){
        container.classList.toggle('hidden', true)
    }

    const styles = `
        .loader-container.hidden { display: none; }
        .loader-container {
            position: absolute;
            width: 100%;
            height: 100%;
            top: 0;
            left: 0;
            z-index: 10;
            background-color: var(--bg-color, #263038);
            display: flex;
            justify-content: center;
            align-items: center;
        }
        .loader {
            width: 48px;
            height: 48px;
            border: 5px solid var(--fg-color, #FFF);
            border-bottom-color: var(--primary-color, #FF3D00);
            border-radius: 50%;
            display: inline-block;
            box-sizing: border-box;
            animation: rotation 1s linear infinite;
        }

        @keyframes rotation {
            0%   { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    `
    appendStyle(styles)

    return {
        container, render, show, hide
    }
}
