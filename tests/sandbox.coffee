a = ->
  'bobobo'

a = 100
pow = (a) ->
  a * a
console.log a

b = 10
calc = (a) ->
  a * b
console.log b

c = sum: a + b


class A

  constructor: (@name) ->

class B extends A

  constructor: ({ @name }) ->
    super @name
    a += 1000

b = new B name: a + b
b.name = 'override!!'
