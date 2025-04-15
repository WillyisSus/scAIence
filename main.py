# def findPalindromes(letter_dict: dict, count: int) -> int:
#
#     return findPalindromes()



s = "aaaabc"

print(min([k for k in list(set([s[i:j] for i in range(len(s) - 1) for j in range(len(s))])) if s.count(k) == 1 and k != ""], key=len))

# print(findPalindromes(letters, len(s)))
