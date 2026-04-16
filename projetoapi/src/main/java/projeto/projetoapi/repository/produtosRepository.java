package projeto.projetoapi.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import projeto.projetoapi.models.produtosapi;

public interface produtosRepository extends JpaRepository<produtosapi, String> {

}
