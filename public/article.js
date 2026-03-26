const readerContent = document.getElementById("readerContent");
const englishOnlyButton = document.getElementById("englishOnlyButton");
const bilingualButton = document.getElementById("bilingualButton");
const highlightToggleButton = document.getElementById("highlightToggleButton");

const storedLines = localStorage.getItem("cleanedArticleLines");
const storedText = localStorage.getItem("cleanedArticleText");
const storedDisplayLines = localStorage.getItem("displayArticleLines");
const storedHighlightWords = localStorage.getItem("highlightWords");

let showBilingual = false;
let highlightEnabled = true;

function escapeHtml(text){return String(text).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;");}
function parseJson(text,fallback){try{return JSON.parse(text||"");}catch{return fallback;}}

const sentenceLines = parseJson(storedLines, []);
const displayLines = parseJson(storedDisplayLines, []);
const highlightWords = parseJson(storedHighlightWords, []);

function highlightLine(line){
  if(!highlightEnabled||!highlightWords.length) return escapeHtml(line);
  const sorted=[...new Set(highlightWords)].filter(Boolean).sort((a,b)=>b.length-a.length).map((word)=>word.replace(/[.*+?^${}()|[\]\\]/g,"\\$&"));
  if(!sorted.length) return escapeHtml(line);
  const pattern=new RegExp(`\\b(${sorted.join("|")})\\b`,"gi");
  return escapeHtml(line).replace(pattern,'<span class="word-highlight">$1</span>');
}

function renderReader(){
  const fallbackLines=(storedText||"").split(/\r?\n/).map((line)=>line.trim()).filter(Boolean);
  const lines=displayLines.length?displayLines:(sentenceLines.length?sentenceLines:fallbackLines);
  if(!lines.length) return;
  readerContent.innerHTML="";
  for(const line of lines){
    const paragraph=document.createElement("p");
    const isEn=/[A-Za-z]/.test(line);
    paragraph.className=`reader-line ${isEn?"en":"zh"}`;
    if(showBilingual||isEn){
      if(isEn){
        paragraph.innerHTML=highlightLine(line);
      } else {
        paragraph.textContent=line;
      }
      readerContent.appendChild(paragraph);
    }
  }
}

englishOnlyButton.addEventListener("click",()=>{showBilingual=false;englishOnlyButton.classList.add("active-mode");bilingualButton.classList.remove("active-mode");renderReader();});
bilingualButton.addEventListener("click",()=>{showBilingual=true;bilingualButton.classList.add("active-mode");englishOnlyButton.classList.remove("active-mode");renderReader();});
highlightToggleButton.addEventListener("click",()=>{highlightEnabled=!highlightEnabled;highlightToggleButton.textContent=highlightEnabled?"关闭高亮":"开启高亮";renderReader();});
if(!displayLines.some((line)=>!/[A-Za-z]/.test(line))) bilingualButton.disabled=true;
renderReader();
