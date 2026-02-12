import time, random

print('\nPassword Checker\n--------------------------')
print(
    '*Strong passwords should be at least 8 characters long, combining numbers, and symbols to ensure security'
      )
pw = input("create new password >")

if len(pw) < 8:
    
    print('your password is too short. At least 8 characters long')
elif not (any(c.isalpha() for c in pw) and any(c.isdigit() for c in pw)):
    print('❌ Your password must contain both letters and numbers.')

else:
    savedpw = pw
    confpw = input('enter password again >')
    if confpw == savedpw:
        print('Wait a minute...')
        time.sleep(random.randint(1, 4))
        print('Well done! now you have your own password!')
    else:
        print('your password is incorrect. Try again from start.')