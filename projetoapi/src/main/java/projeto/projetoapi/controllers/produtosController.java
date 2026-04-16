package projeto.projetoapi.controllers;

import lombok.Data;
import org.springframework.web.bind.annotation.*;
import projeto.projetoapi.models.produtosapi;
import projeto.projetoapi.repository.produtosRepository;

import java.util.List;

@Data
@RestController
@RequestMapping("produtos")
public class produtosController {

     private final produtosRepository produtosRepository;

     @GetMapping
     public List<produtosapi> findAll(){
         return produtosRepository.findAll();
     }

     @GetMapping("{id}")
     public produtosapi buscar(@PathVariable String id){
         return produtosRepository.findById(id).orElse(null);
     }

     @PostMapping
     public produtosapi criar(@RequestBody produtosapi produtosapi){
         return produtosRepository.save(produtosapi);
     }

     @PutMapping("{id}")
     public produtosapi atualizar(@PathVariable String id, @RequestBody produtosapi produtosapi){
         produtosapi.setId(id);
         return produtosRepository.save(produtosapi);
     }

     @DeleteMapping("{id}")
     public void deletar(@PathVariable String id){
         produtosRepository.deleteById(id);
     }

}
