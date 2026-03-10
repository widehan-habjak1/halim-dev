import random, time
from rich.table import Table
from rich.console import Console
from rich.panel import Panel
from rich.progress import track
console = Console()

arr = []
temp = 0

console.print(Panel("Random List Sorter", subtitle="v1.0", expand=False))
time.sleep(0.3)
print('Hello! Welcome to our Random List Sorter program.')
time.sleep(3)
print("In this program you can put the numbers of " \
"random data you want to generate.")
time.sleep(3)
print('Then, we sort the order of random numbers there. ' \
'Just for testing my first bubble sort.')
time.sleep(2)
print('Wait a second,')
print('Preparing the program...')
time.sleep(random.randint(1, 4))

while True:
    n = int(input('How much number that you want to generate? >'))
    for step in track(range(100), description='Generating a random list...'):
        time.sleep(0.03)

    for i in range(n + 1):
        a = random.randint(1, 100)
        arr.append(a)
    time.sleep(2)

    table = Table(title="Result")

    table.add_column("Name", style="cyan", no_wrap=True)
    table.add_column("Complexity", style="magenta")
    table.add_column("Status", justify="right", style="green")
    table.add_row("Before Sort", f"{arr}", "Raw Data")

    for i in range(len(arr)):
        for j in range(0, len(arr) - 1 - i):
            if arr[j] > arr[j + 1]:
                temp = arr[j]
                arr[j] = arr[j + 1]
                arr[j + 1] = temp

    table.add_row("After Sort", f"{arr}", "Sorted Data")

    console.print(table)
    
    time.sleep(0.2)
    m = input('Want to continue? (y/n) >')
    if m == 'y':
        arr = []
        continue
    elif m == 'n':
        print('There you go. Thank you for enjoying our program. - Developer')
        break
    else:
        print("<error: input is INVALID>")
        break
