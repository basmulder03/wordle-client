# import re;

# def create_wordlist_with_letters_amount(amount):
#     with open('./wordlist/basiswoorden-gekeurd.txt', 'r') as wl:
#         wordlist = wl.read().strip().split('\n')
#         wordlist = ['\t"' + word.lower() + '",' for word in wordlist if len(word) == amount and re.match("[a-zA-Z]{5}", word)]
#         with open('./src/chosen_words.js', 'w') as w:
#             wordlist.insert(0, 'export const words = [')
#             new_text = "\n".join(wordlist)
#             new_text += "\n];\n\nexport const checkIfWordValid = (word) => words.includes(word);\nexport const getRandomWord = () => words[Math.floor(Math.random()*words.length)];"
#             w.write(new_text)

#     with open('./wordlist/wordlist.txt', 'r') as wl:
#         wordlist = wl.read().strip().split('\n')
#         wordlist = ['\t"' + word.lower() + '",' for word in wordlist if len(word) == amount and re.match("[a-zA-Z]{5}", word)]
#         with open('./src/words.js', 'w') as w:
#             wordlist.insert(0, 'export const words = [')
#             new_text = "\n".join(wordlist)
#             new_text += "\n];\n\nexport const checkIfWordValid = (word) => words.includes(word);\nexport const getRandomWord = () => words[Math.floor(Math.random()*words.length)];"
#             w.write(new_text)

# create_wordlist_with_letters_amount(5)

import json

def write_file(filename, filename_to):
    words = {}
    with open(filename, 'r') as wl:
        wordlist = wl.read().strip().split('\n')
        for word in wordlist:
            if word.isalpha() and word.isascii():
                if not len(word) in words:
                    words[len(word)] = []
                words[len(word)].append(word)
    j = json.dumps(words, indent=4)
    text = "const words = " + j + "\n\n\n\n";
    text += "export const checkIfWordValid = (word) => words[word.length].includes(word);\n\nexport const getRandomWord = (len) => words[len][Math.floor(Math.random()*words[len].length)];"
    with open(filename_to, 'w') as t:
        t.write(text);        


write_file('./wordlist/wordlist.txt', './src/words.js')
write_file('./wordlist/basiswoorden-gekeurd.txt', './src/chosen_words.js')
    
