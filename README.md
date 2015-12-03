#Javscript Java Thread Analyzer

This project is a thread analyzer (TDA) for java threads wrote in javascript, it's very usefull if you want to analyze threads and it's very easy to embbed if you have any server console 

## Demo
[https://javascript-tda.herokuapp.com/](https://javascript-tda.herokuapp.com/)

## How to Use

### Properties

#### DumpAnalyzer 
  ```
  dump #The plain dump 
  thread_analyzers #An array of thread analyzers (filtered if a filter is applied 
  stack_analyzer # A Json result of an analyzed stack {name: "thread name, first is empty", states:[{name:"state",count:XX}],total:XX,threads:[thread ids],children:[more like this]} 
  total_threads #Total amoun of threads 
  thread_states #Map of counts by thread states 
  thread_status #Map of counts by thread status
  dead_locks #Not implemented yet 
  ```
#### ThreadAnalyzer 
  ```
  has_locked_objects # True if has locked obect 
  locked_objects # List of locked objects
  waiting # True if is waiting on object
  waiting_obj # The locked object
  stack # List with the stack parsed (one element per line)
  state # Thread state
  parsed_ok # True if thread has been parsed succesfully 
  name # Thread name
  id # Thread id
  native_id # Thread native id 
  ```
### Node
  ```javascript 
  var DumpAnalyzer require("DumpAnalyzer")
  var dump new DumpAnalyzer(dumpStr)
  ```
### Html
 ```html
  <script src="https://raw.githubusercontent.com/geisbruch/javascript-java-thread-analyzer/master/dist/js/java-thread-analyzer.js"></script>
  <script src="https://raw.githubusercontent.com/geisbruch/javascript-java-thread-analyzer/master/browser/thread_dump_render.js"></script>
 ``` 
 ```javascript
 dump = new JavaTDA.TDARender($("#dump-text").val(),$("#div-to-render"),{status:{},stack:{},raw:{}});
 dump.redraw(); 
 dump.filter([$("#filter_text_regex").val()])
 ``` 

### Options
  

##TODO
  - Improve front (and remove hardcode html strings)
  - Tests
  - Deadlock detector
