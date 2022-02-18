fetch(chrome.runtime.getURL("words.txt")).then(async res => await res.text()).then(words => words.split("\n")).then(words => {
    const run = document.createElement("button");
    run.id = "run-ai";

    const getState = () => JSON.parse(localStorage.getItem("nyt-wordle-state"));

    function canRun(state) {
        return state.gameStatus === "IN_PROGRESS";
    }

    if(!canRun(getState()))
        run.disabled = true;

    function pressKey(key) {
        window.dispatchEvent(new KeyboardEvent("keydown", { key }));
    }

    function enterWord(word) {
        for(var i = 0; i < 5; i++)
            pressKey("Backspace");
        
        for(const letter of word.toLowerCase().split(""))
            pressKey(letter);
        
        pressKey("Enter");
    }

    function runAi() {
        var row = 0;

        const contains = [];
        const notContain = [];

        for(var rowIndex = 0; rowIndex < 6 - getState().rowIndex; rowIndex++) {
            var noWord = false;

            setTimeout(() => {
                const state = getState();

                if(noWord || !canRun(state)) 
                    return run.classList.remove("running");

                try {
                    const boardState = state.boardState;

                    state.solution = null; // reading the solution from the state is a crime

                    const correct = [];

                    const stateStr = boardState[row - 1] || words[0];

                    const stateWord = stateStr.split("");

                    for(var i = 0; i < stateWord.length; i++) {
                        const evaluation = (state.evaluations[row - 1] || [])[i];

                        const letter = stateWord[i];
                        if(!letter) continue;

                        switch(evaluation) {
                        case "correct":
                            correct.push(letter);

                            delete contains[contains.findIndex(el => el.letter === letter)];
                            
                            break;
                        case "present":
                            correct.push(".");
                            if(!contains.some(el => el.letter === letter))
                                contains.push({ letter, index: i });

                            break;
                        case undefined: break;
                        default:
                            correct.push(".");
                            if(!contains.some(el => el.letter === letter) && !notContain.includes(letter))
                                notContain.push(letter);
                        }
                    }

                    const correctRegex = new RegExp(correct.join(""));

                    const word = words.find(el => 
                        !boardState.includes(el) &&
                        correctRegex.test(el) &&
                        (el = el.split("").map(el => 
                            correct[i] !== el ? el : null
                        )) &&
                        !notContain.some(letter => el.includes(letter)) &&
                        contains.every(({ letter, index }) => {
                            if(letter === null) return true;

                            const indexOfLetter = el.indexOf(letter);

                            return indexOfLetter !== -1 && indexOfLetter !== index;
                        })
                    );

                    enterWord(word);

                    row++;
                } catch(exception) { // just in case
                    console.error(exception);

                    alert("An error ocurred");
                    noWord = true;

                    return;
                }
            }, 2000 * rowIndex);
        }
    }

    run.onclick = () => {
        run.disabled = true;

        const state = getState();

        if(!canRun(state)) return;

        run.classList.add("running");
        runAi();
    };

    document.body.appendChild(run);
});