import time

n = int(input())
m = int(input())

if m > n:
    print('bro thats outnumbered.')
else:
    for i in range(1, min(n, m)+1):
        print(i)
        time.sleep(1)
