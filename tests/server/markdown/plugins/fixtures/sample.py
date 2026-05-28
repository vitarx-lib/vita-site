def greet(name):
    return f"Hello, {name}!"

class Animal:
    def __init__(self, species):
        self.species = species

    def speak(self):
        raise NotImplementedError
