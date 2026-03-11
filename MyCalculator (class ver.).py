import time
from rich.console import Console
from rich.panel import Panel
from rich.progress import track
console = Console()


class MyCalculator:
    def __init__(self):
        pass
    
    def calculate(self, op, n):         # Perform the calculation based on operation and numbers
        try:
            if op == '+':
                ans = 0
                for i in n:
                    ans += i
            elif op == '-':
                ans = 0
                for i in n:
                    ans -= i
            elif op == '*':
                ans = 1
                for i in n:
                    ans *= i
            elif op == '/':
                ans = n[0]
                for i in n[1:]:
                    if i == 0:
                        return 'you cannot divide by zero. Try again.'
                    ans = ans / i
            else:
                return 'Invalid operation'
            return ans
        except Exception as e:
            return f'Error: {str(e)}'
    
    def run(self): # run the calculator
        console.print(Panel('[bold]My Calculator', subtitle='v1.1', expand=False))
        console.print('[italic]This calculator was made with class in Python.')
        console.print('Calculation: +, -, *, /')
        console.print("[bold blue]UPDATE -- UI enhanced")
        time.sleep(2)
        
        while True:
            n = input("Start the calculation >").split()
            if len(n) < 3:
                print('Please input in valid ' \
                'format: (number) (operation symbol) (number)')
                break
            n1 = int(n[0])
            op = n[1]
            n2 = int(n[2])
            numbers = [n1, n2]
            res = self.calculate(op, numbers)
            console.print(Panel("{} {} {} = {}".format(n[0], n[1], n[2], res), expand=False))

            ask = input('Wanna calculate more? (y/n) ')
            if ask == 'y':
                continue
            elif ask == 'n':
                print('astaghfirullah bang')
                quit()

kalkulator = MyCalculator()
kalkulator.run()
