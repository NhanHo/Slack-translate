document.body.style.border = "5px solid blue";
let elementSelector = '.p-rich_text_section';
let targetNode = document.getElementsByClassName('p-workspace__primary_view_body')[0];
// Options for the observer (which mutations to observe)
const config = { attributes: true, childList:true, subtree: true, characterData: true, attributeOldValue: true };


let cred = {
    awsAccessKeyId: "AKIAYRPV4IV5IQOUS7LY",
    awsSecretAccessKey: "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"
}
AWS.config.region = 'ap-northeast-1';
let ep = new AWS.Endpoint('https://translate.ap-northeast-1.amazonaws.com');

AWS.config.credentials = new AWS.Credentials(cred.awsAccessKeyId, cred.awsSecretAccessKey);
let translator = new AWS.Translate({endpoint: ep, region: AWS.config.region});
let params = {
    "Text": "エディターでaiファイル入れ込むと【元々エディター上に配置されてた成分表示】と【aiテンプレにある成分表示】が重複しちゃいますね…:sob:",
    "SourceLanguageCode": "auto",
    "TargetLanguageCode": "en"
}

// Callback function to execute when mutations are observed
let x = 0;
function findTextNode(node) {
    if (node.nodeType == node.TEXT_NODE)
        return [node];
    let result = [];
    for (let child of node.childNodes) {
        result.push(...findTextNode(child));
    }
    return result;
}

const callback = function(mutationsList, observer) {
    // Use traditional 'for loops' for IE 11
    for(let mutation of mutationsList) {
        if (mutation.type === 'childList') {
            console.log(mutation);
            if (mutation.addedNodes.length > 0)
                if (mutation.addedNodes[0].className === "c-virtual_list__item") {
                    let elements = mutation.addedNodes[0].getElementsByClassName("p-rich_text_block");
                    if (elements.length > 0) {
                        let textEls = findTextNode(elements[0]);
                        for (let t of textEls) {
                            console.log(t.textContent);
                            let postParams = {...params, "Text": t.textContent};
                            console.log(postParams);
                            translator.translateText(postParams, function onIncomingMessageTranslate(err, data)  {
                                if (err) {
                                    console.log(err);
                                }
                                if (data) {
                                    console.log("Success!");
                                    t.nodeValue = data.TranslatedText;
                                }
                            })
                        }
                    }
                }
        }
        else if (mutation.type === 'attributes') {
            //console.log('The ' + mutation.attributeName + ' attribute was modified.');
        }
        //console.log(mutation);
    }
};

// Create an observer instance linked to the callback function
const observer = new MutationObserver(callback);

// Start observing the target node for configured mutations
//
function docReady(fn) {
    // see if DOM is already available
    let targetNode = document.getElementsByClassName('p-workspace__primary_view_body')[0];
    console.log(targetNode);
    //if (document.readyState === "complete" || document.readyState === "interactive") {
    if (targetNode) {
        // call on next available tick
        alert(targetNode);
        setTimeout(fn, 1);
    } else {
        console.log("Looking for node");
        document.addEventListener("DOMContentLoaded", fn);
    }
}
//const config = { attributes: true, childList:true, subtree: true, characterData: true, attributeOldValue: true };
//const targetNode = document.getElementsByClassName('p-workspace__primary_view_body')[0];
let lock = false;
const docCallback = function(mutationsList, observer) {
    // Use traditional 'for loops' for IE 11
    if (lock) return;
    for(let mutation of mutationsList) {
        if (mutation.type === 'childList') {
            if (mutation.target.className === "p-client_container") {
                //docObserver.disconnect();
                let targetNodes =  document.getElementsByClassName('c-virtual_list__scroll_container');

                observer = new MutationObserver(callback);
                for (let node of targetNodes) {
                    observer.observe(node, config);
                    lock = true;
                }
            }
        }
        else if (mutation.type === 'attributes') {
            //console.log('The ' + mutation.attributeName + ' attribute was modified.');
        }
        //console.log(mutation);
    }
};
const docObserver = new MutationObserver(docCallback);
//observer.observe(targetNode, config);
//docObserver.observe(targetNode, config);
docObserver.observe(document.body, config);
/*docReady(function() {
    //observer.observe(targetNode, config);
    })*/
/*$(document).on("ready", ".p-workspace__primary_view_body", function name() {
    alert("Here");
    })*/

/*document.addEventListener('load', function(e) {
    // loop parent nodes from the target to the delegation node
    alert("Observe");
    for (var target = e.target; target && target != this; target = target.parentNode) {
        if (target.matches(elementSelector)) {
            //handler.call(target, e);
        }
    }
}, false);*/

// Later, you can stop observing
//observer.disconnect();

