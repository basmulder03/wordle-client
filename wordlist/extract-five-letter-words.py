import re;

with open('./wordlist/basiswoorden-gekeurd.txt', 'r') as wl:
    wordlist = wl.read().strip().split('\n')
    wordlist = ['\t"' + word.lower() + '",' for word in wordlist if len(word) == 5 and re.match("[a-zA-Z]{5}", word)]
    with open('./src/chosen_words.js', 'w') as w:
        wordlist.insert(0, 'export const words = [')
        new_text = "\n".join(wordlist)
        new_text += "\n];\n\nexport const checkIfWordValid = (word) => words.includes(word);\nexport const getRandomWord = () => words[Math.floor(Math.random()*words.length)];"
        w.write(new_text)