import random, time

# outfit codinatior (weather-suggested)
m = input('Enter the current weather info today (sunny, mild, windy, rainy) >')
ootd = [
    'Oversized T-shirt + straight pants with canvas sneakers or sandals',
    'Light knit / long-sleeve tee with loose slacks or cargo pants',
    'Zip hoodie / light jacket with jogger or denim',
    'Windbreaker / waterproof jacket with dark pants (quick-dry)'
]

print('finding your best outfit...')
time.sleep(random.randrange(1, 3))
match m:
    case 'sunny':
        print('-- Today outfit recommendation: {}'.format(ootd[0]))
        print('Thanks for using our program.')
    case 'windy':
        print('-- Today outfit recommendation: {}'.format(ootd[2]))
        print('Thanks for using our program.')
    case 'mild':
        print('-- Today outfit recommendation: {}'.format(ootd[1]))
        print('Thanks for using our program.')
    case 'mild':
        print('-- Today outfit recommendation: {}'.format(ootd[3]))
        print('Thanks for using our program.')
    case _:
        print('Error: no weather information for that')
