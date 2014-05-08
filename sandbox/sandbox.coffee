if a
  a


a = b = 100
b = a * b / 10
sum = ->
  a + b

100
10
0xff
'foo'
"bar"
'''baz'''
"""
multi
line
string
"""
/wtf\sjs/
///
wtf
\s
js
///


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
a = 100
c = sum: a + b

a = b = 100
calc = (a) ->
  a * b
a /= b

func0 = ->
  abc = 100
  func1 = ->
    abc = 200
  func2 = ->
    abc = 200

do ->
  for variable in variables
    return variable


class A

  constructor: (@code) ->

class B extends A

  constructor: ({ @name }) ->
    super @name
    a += 1000

b = new B name: a + b
b.name = 'override!!'


{ a, b } = obj
[ a, b ] = arr
a = b = 100

#TODO
for { a } in arr
  a = 100
for [ a ] in arr
  a = 100


obj =
  a: 'foo'
obj.a
isObjA = obj.a?

if code is 'abc'
  code = new A code
if code
  code = new B code
codes = []
for code, i in codes
  console.log i, code

if a
  a = a / a
[
  (a) ->
    a 1
  (a) ->
    a 2
]

func0 = ->
  abcde = 100
func1 = ->
  abcde = 100
func0 = -> abcde = 100
func1 = -> abcde = 100

func = ({ a }) ->
  a 1
