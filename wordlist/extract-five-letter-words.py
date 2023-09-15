import re;

with open('./wordlist/wordlist.txt', 'r') as wl:
    wordlist = wl.read().strip().split('\n')
    wordlist = ['"' + word.lower() + '"' for word in wordlist if len(word) == 5 and re.match("[a-zA-Z]{5}", word)]
    with open('./wordlist/words.json', 'w') as w:
        w.write(",\n".join(wordlist))