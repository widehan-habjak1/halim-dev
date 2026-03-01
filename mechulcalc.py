import time

productname = input('Enter the product name >')
pr1 = int(input('how much the price? >'))
pack = int(input('how much if you sell 3 product? >'))
q = int(input("how many you sell that product for today? >"))

packpr = (q // 3) * pack
total = ((q % 3) * pr1) + packpr
print('calculating the price...')
time.sleep(1)
print('\n-------')
print('Product Name: {}'.format(productname))
print('the total money you got is: {}'.format(total))
