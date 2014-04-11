# a = b = 100
# b = a * b / 10
# sum = ->
#   a + b
#
# a = ->
#   'bobobo'

# a = 100
# pow = (a) ->
#   a * a
# console.log a

# b = 10
# calc = (a) ->
#   a * b
# console.log b
# a = 100
# c = sum: a + b

a = b = 100
calc = (a) ->
  a * b
a /= b


# class A
#
#   constructor: (@code) ->
#
# class B extends A
#
#   constructor: ({ @name }) ->
#     super @name
#     a += 1000

# b = new B name: a + b
# b.name = 'override!!'
#
# obj =
#   a: 'foo'
# obj.a
# isObjA = obj.a?
#
# if code is 'abc'
#   code = new A code
# if code
#   code = new B code
#
# if a
#   a = a / a
