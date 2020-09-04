package de.fhg.iais.roberta.worker.transform;

import de.fhg.iais.roberta.bean.NewUsedHardwareBean;
import de.fhg.iais.roberta.components.Project;
import de.fhg.iais.roberta.visitor.ITransformerVisitor;
import de.fhg.iais.roberta.worker.Three2FourTransformerWorker;

public class Ev3Three2FourTransformerWorker extends Three2FourTransformerWorker {

    @Override
    protected ITransformerVisitor<Void> getVisitor(
        Project project, NewUsedHardwareBean.Builder builder) {
        return super.getVisitor(project, builder);
    }
}
