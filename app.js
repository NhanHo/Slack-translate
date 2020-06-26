document.body.style.border = "5px solid blue";
const config = { attributes: true, childList:true, subtree: true, characterData: true, attributeOldValue: true };
AWS.config.region = 'ap-northeast-1';
let ep = new AWS.Endpoint('https://translate.ap-northeast-1.amazonaws.com');

AWS.config.credentials = new AWS.Credentials(cred.awsAccessKeyId, cred.awsSecretAccessKey);
let translator = new AWS.Translate({endpoint: ep, region: AWS.config.region});
let params = {
    "Text": "エディターでaiファイル入れ込むと【元々エディター上に配置されてた成分表示】と【aiテンプレにある成分表示】が重複しちゃいますね…:sob:",
    "SourceLanguageCode": "auto",
    "TargetLanguageCode": "en"
}
let re = new RegExp("[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\uff66-\uff9f]");
// Callback function to execute when mutations are observed
let x = 0;
if (localStorage.length > 100000) {
    for (let i in localStorage) {
        localStorage.removeItem(i);
    }
}
function findTextNode(node) {
    if (node.nodeType == node.TEXT_NODE)
        return [node];
    let result = [];
    for (let child of node.childNodes) {
        result.push(...findTextNode(child));
    }
    return result;
}
let getCache = function(text) {
    return localStorage.getItem(text);
}
const callback = function(mutationsList, observer) {
    for(let mutation of mutationsList) {
        if (mutation.type === 'childList') {
            if (mutation.addedNodes.length > 0)
                if (mutation.addedNodes[0].className === "c-virtual_list__item") {
                    let elements = mutation.addedNodes[0].getElementsByClassName("p-rich_text_block");
                    if (elements.length > 0) {
                        let textEls = findTextNode(elements[0]);
                        for (let t of textEls) {
                            let textValue = t.textContent;
                            if (textValue.match(re) == null) continue;

                            let cacheContent = getCache(textValue);

                            if (cacheContent) {
                                console.log("Cache found");
                                t.nodeValue = cacheContent;
                                continue;
                            }
                            let postParams = {...params, "Text": t.textContent};
                            translator.translateText(postParams, function onIncomingMessageTranslate(err, data)  {
                                if (err) {
                                    console.log(err);
                                }
                                if (data) {
                                    console.log("Success!");
                                    localStorage.setItem(t.textContent, data.TranslatedText);
                                    t.nodeValue = data.TranslatedText;
                                }
                            })
                        }
                    }
                }
        }
        else if (mutation.type === 'attributes') {
        }
    }
};

const observer = new MutationObserver(callback);

let lock = false;
const docCallback = function(mutationsList, observer) {
    // Use traditional 'for loops' for IE 11
    if (lock) return;
    for(let mutation of mutationsList) {
        if (mutation.type === 'childList') {
            if (mutation.target.className === "p-client_container") {
                docObserver.disconnect();
                let targetNodes =  document.getElementsByClassName('c-virtual_list__scroll_container');

                observer = new MutationObserver(callback);
                for (let node of targetNodes) {
                    observer.observe(node, config);
                    lock = true;
                }
            }
        }
    }
};
const docObserver = new MutationObserver(docCallback);
docObserver.observe(document.body, config);

// Later, you can stop observing
//observer.disconnect();

